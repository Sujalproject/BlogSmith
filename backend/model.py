from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.4,
)



if __name__ == "__main__":
    try:
        response = llm.invoke("Explain LangGraph in two 20 words.")
        print("Groq connection successful!")
        print(response.content)

    except Exception as e:
        print("Groq connection failed!")
        print(e)