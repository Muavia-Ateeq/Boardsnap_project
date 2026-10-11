import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import main
from fastapi import HTTPException


class ProviderTests(unittest.TestCase):
    def test_groq_returns_json_from_groq_chat_completion(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='{"answer":"grounded"}')
                )
            ]
        )
        with (
            patch.object(main, "LLM_PROVIDER", "groq"),
            patch.object(main, "GROQ_API_KEY", "test-key"),
            patch.object(main, "GROQ_MODEL", "openai/gpt-oss-120b"),
            patch("openai.OpenAI") as openai_client,
        ):
            openai_client.return_value.chat.completions.create.return_value = response

            result = main.generate_json("Return JSON")

        self.assertEqual(result, {"answer": "grounded"})
        openai_client.assert_called_once_with(
            api_key="test-key",
            base_url="https://api.groq.com/openai/v1",
        )
        openai_client.return_value.chat.completions.create.assert_called_once_with(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": "Return JSON"}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

    def test_groq_requires_groq_api_key(self):
        with (
            patch.object(main, "LLM_PROVIDER", "groq"),
            patch.object(main, "GROQ_API_KEY", ""),
        ):
            with self.assertRaises(HTTPException) as caught:
                main.generate_json("Return JSON")

        self.assertEqual(caught.exception.status_code, 500)
        self.assertIn("GROQ_API_KEY", caught.exception.detail)

    def test_groq_returns_top_level_json_array_without_object_mode(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content="[]")
                )
            ]
        )
        with (
            patch.object(main, "LLM_PROVIDER", "groq"),
            patch.object(main, "GROQ_API_KEY", "test-key"),
            patch("openai.OpenAI") as openai_client,
        ):
            openai_client.return_value.chat.completions.create.return_value = response

            result = main.generate_json("Return an array", json_object=False)

        self.assertEqual(result, [])
        call_kwargs = openai_client.return_value.chat.completions.create.call_args.kwargs
        self.assertNotIn("response_format", call_kwargs)

    def test_quiz_requests_top_level_json_array(self):
        with patch.object(main, "generate_json", return_value=[]) as generate:
            result = main.generate_quiz(main.QuizRequest(notes={"keyPoints": ["A fact"]}))

        self.assertEqual(result, [])
        self.assertFalse(generate.call_args.kwargs["json_object"])

    def test_grok_returns_json_from_xai_chat_completion(self):
        response = SimpleNamespace(
            choices=[
                SimpleNamespace(
                    message=SimpleNamespace(content='{"answer":"grounded"}')
                )
            ]
        )
        with (
            patch.object(main, "LLM_PROVIDER", "grok"),
            patch.object(main, "XAI_API_KEY", "test-key"),
            patch.object(main, "GROK_MODEL", "grok-test"),
            patch("openai.OpenAI") as openai_client,
        ):
            openai_client.return_value.chat.completions.create.return_value = response

            result = main.generate_json("Return JSON")

        self.assertEqual(result, {"answer": "grounded"})
        openai_client.assert_called_once_with(
            api_key="test-key",
            base_url="https://api.x.ai/v1",
        )
        openai_client.return_value.chat.completions.create.assert_called_once_with(
            model="grok-test",
            messages=[{"role": "user", "content": "Return JSON"}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

    def test_grok_requires_xai_api_key(self):
        with (
            patch.object(main, "LLM_PROVIDER", "grok"),
            patch.object(main, "XAI_API_KEY", ""),
        ):
            with self.assertRaises(HTTPException) as caught:
                main.generate_json("Return JSON")

        self.assertEqual(caught.exception.status_code, 500)
        self.assertIn("XAI_API_KEY", caught.exception.detail)

    def test_gemini_provider_remains_available(self):
        response = SimpleNamespace(text='{"answer":"gemini"}')
        model = Mock()
        model.generate_content.return_value = response
        with (
            patch.object(main, "LLM_PROVIDER", "gemini"),
            patch.object(main, "API_KEY", "test-key"),
            patch.object(main.genai, "GenerativeModel", return_value=model),
        ):
            result = main.generate_json("Return JSON")

        self.assertEqual(result, {"answer": "gemini"})


if __name__ == "__main__":
    unittest.main()
