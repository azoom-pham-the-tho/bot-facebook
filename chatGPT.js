import { Configuration, OpenAIApi } from "openai";

const config = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(config);

const historyChat = new Map();
export const getAnswerWithGPT = async (theadId, question) => {
  const chat = historyChat.get(theadId);
  let messages;
  if (chat) {
    messages = [
      ...chat,
      {
        role: "user",
        content: question,
      },
    ];
  } else {
    messages = [
      {
        role: "user",
        content: question,
      },
    ];
  }
  const answser = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    max_tokens: 300,
    n: 1,
    messages,
  });

  const answerMessgae = answser.data.choices[0].message.content;
  messages = [
    ...messages,
    {
      role: "assistant",
      content: answerMessgae,
    },
  ];
  historyChat.set(theadId, messages);
  return answerMessgae;
};
export const generateImageWithGPT = async (question) => {
  const answser = await openai.createImage({
    prompt: question,
    size: "512x512",
    response_format: "url",
  });
  return answser.data.data[0].url;
};
