import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Print the API key for debugging (remove this in production)
print("OpenAI API Key:", os.getenv('OPENAI_API_KEY'))

# Initialize the OpenAI client
client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

async def test_openai():
    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello!"}
            ],
            model="gpt-4"
        )
        print("Response from OpenAI:", response.choices[0].message.content)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_openai())
