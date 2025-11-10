import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const returnHeaders = {
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  status: 200,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-client-info, apikey, Authorization",
      },
    });
  }

  try {
    const res = await fetch(
      "https://api.github.com/repos/joshmarnold/clipp/releases/latest",
      {
        headers: {
          Authorization: `token ${Deno.env.get("GITHUB_API_KEY")}`,
        },
      }
    );

    const data = await res.json();
    const dmgAsset = data.assets.find((asset: any) =>
      asset.name.endsWith(".dmg")
    );

    if (!dmgAsset.browser_download_url) {
      throw new Error("No .dmg asset found in latest release");
    }

    const returnData = JSON.stringify({
      version: data.tag_name,
      downloadUrl: dmgAsset.browser_download_url,
    });

    return new Response(returnData, returnHeaders);
  } catch (err) {
    return new Response(JSON.stringify(err), returnHeaders);
  }
});
