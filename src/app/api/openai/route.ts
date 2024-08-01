import { NextResponse } from "next/server";
import OpenAI from "openai";
import { env } from "~/env";

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY
});

interface RequestBody {
  prompt: string;
}


export async function POST(request: Request) {
    try {
        const body = await request.json() as RequestBody;

        if (typeof body.prompt !== 'string') {
            throw new Error('Invalid request body');
        }

        const fullPrompt = 'Generate possible recipies given - ' + body.prompt;
        const results = await openai.chat.completions.create({
            messages: [
                {role: 'system', content: 'You are a food expert and a five michelin star chef.'},
                {role: 'user', content: fullPrompt},
            ],
            model: 'gpt-4o-mini',
        });

        return NextResponse.json({ result: results.choices[0]?.message.content });
    } catch (error) {
        return NextResponse.json({ error: 'Error processing your request' }, { status: 500 });
    }
}