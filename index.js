import { Client } from "fca-utils";
import similarity from "similarity";
import dataTrainning from "./data.js";
import { generateImageWithGPT, getAnswerWithGPT } from "./chatGPT.js";

const client = new Client({
  prefix: process.env.PREFIX,
  ignoreMessageInCommandEvent: false,
});
let theadId, message;
client.openServer(process.env.PORT);
client.loginWithAppState(process.env.APPSTATE);
client.on("ready", (_, aid) => console.log("login with app id:", aid));

const usersHistory = new Map();
client.on("command", async (command) => {
  try {
    const userInfo = await getUserInfo(command.message.senderID);
    if (!usersHistory.get(userInfo.id)) {
      command.message.send(
        `Đầu tiên tôi xin gửi lời chào đến bạn ${userInfo.name}, chúc bạn có một ngày thât tốt lành :)`
      );
      usersHistory.set(userInfo.id, userInfo);
    }
    theadId = command.message.threadID;
    message = command.name + " " + command.commandArgs.join(" ");

    if (["create", "tạo"].includes(command.name)) {
      handlerCreateImage(command);
      return;
    }

    if (command.name == "gpt") {
      handlerChatGPT(command);
      return;
    }

    handlerDefault(command);
  } catch (error) {
    console.log(error);
    command.message.reply("đã có lỗi xảy ra");
  }
});

client.on("error", (e) => {
  console.error("login error");
  console.error(e);
});

const handlerChatGPT = async (command) => {
  console.log("ask chat GPT");
  const answer = await getAnswerWithGPT(theadId, message);
  command.message.reply(answer);
  return;
};

const handlerDefault = async (command) => {
  const listScore = dataTrainning.map((data) => {
    return similarity(message, data.question);
  });
  const maxScore = Math.max(...listScore);
  console.log(maxScore);

  if (maxScore >= 0.6) {
    console.log("get data trainning");
    const index = listScore.findIndex((item) => item == maxScore);
    command.message.reply(dataTrainning[index].answer);
  }
  if (maxScore >= 0.3 && maxScore < 0.6) {
    console.log("ask chat GPT");
    const answer = await getAnswerWithGPT(theadId, message);
    command.message.reply(answer);
  }
  if (maxScore < 0.3) {
    command.message.reply("Mình xin từ chối hiểu :)");
  }
};

const handlerCreateImage = async (command) => {
  const url = await generateImageWithGPT(message);
  command.message.sendAttachment(url);
};
const getUserInfo = async (userId) => {
  const api = client.getApi();
  const users = await api.getUserInfo(userId);
  const id = Object.keys(users)[0];
  const userInfo = Object.values(users)[0];
  return {
    id,
    ...userInfo,
  };
};
