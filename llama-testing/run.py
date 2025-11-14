#!/usr/bin/env python3
"""
Test runner using Ollama API with system prompt support
"""

import json
import requests

def load_prompt(path='system-prompt.txt'):
    with open(path) as f:
        return f.read().strip()

def load_inputs(path='test-inputs.json'):
    with open(path) as f:
        return json.load(f)

def run_llama(system_prompt, user_input):
    """Run Llama using ollama HTTP API"""
    try:
        response = requests.post(
            'http://localhost:11434/api/chat',
            json={
                'model': 'llama3.1:8b',
                'messages': [
                    {
                        'role': 'system',
                        'content': system_prompt
                    },
                    {
                        'role': 'user',
                        'content': user_input
                    }
                ],
                'stream': False,
                'options': {
                    'temperature': 0.3,
                    'num_predict': 500
                }
            },
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            return result['message']['content'].strip()
        else:
            print(f"Error: HTTP {response.status_code}")
            return None

    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("Loading prompt and test inputs...")
    prompt = load_prompt()
    inputs = load_inputs()

    print(f"Running {len(inputs)} tests...\n")
    print("=" * 80)

    results = []
    for item in inputs:
        print(f"\nTest {item['id']}:")
        print(f"Input:  {item['input']}")

        output = run_llama(prompt, item['input'])

        results.append({
            'id': item['id'],
            'input': item['input'],
            'output': output
        })

        print(f"Output: {output}")
        print("-" * 80)

    # Save to JSON
    with open('outputs.json', 'w') as f:
        json.dump(results, f, indent=2)

    # Save human-readable version
    with open('outputs.txt', 'w') as f:
        for result in results:
            f.write(f"Test {result['id']}:\n")
            f.write(f"Input:  {result['input']}\n")
            f.write(f"Output: {result['output']}\n")
            f.write("-" * 80 + "\n\n")

    print(f"\nDone! Results saved to outputs.json and outputs.txt")

if __name__ == '__main__':
    main()
