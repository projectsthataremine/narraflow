const { subtle } = require("crypto").webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey("Ed25519", true, ["sign", "verify"]);

  const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  console.log("\n🔐 PRIVATE KEY (store in Supabase secrets):");
  console.log(privateKeyBase64);

  console.log("\n🔓 PUBLIC KEY (store in Electron constants.ts):");
  console.log(publicKeyBase64);

  console.log("\n💡 IMPORTANT: Save both keys securely!");
  console.log("Private key: Only in Supabase secrets (never commit)");
  console.log("Public key: In Electron app constants.ts");
}

generateKeys().catch(console.error);
