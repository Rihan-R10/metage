import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, customApiKey } = body;

    const apiKey = customApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key detected. Provide a key in the Vault or set OPENAI_API_KEY in .env.local.' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a chart data generator. Generate numerical chart data based on the user request.
You MUST return ONLY a JSON object with this exact structure:
{
  "chartTitle": "Title of the chart",
  "data": [
    { "label": "Jan", "value": 100 },
    { "label": "Feb", "value": 200 }
  ]
}`,
          },
          {
            role: 'user',
            content: prompt || 'Generate a monthly growth chart for the last 6 months',
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API Key (401). Check the key in your vault.' },
          { status: 401 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Quota Exceeded (429). Check your OpenAI account billing balance.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI API Error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content;
    const parsedData = JSON.parse(rawContent);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}