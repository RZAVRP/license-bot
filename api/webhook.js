import fs from "fs";

const TOKEN = "8242718121:AAFTjggE_5Ai1qD0BmSw8q56h7cB4BHigiA";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const body = req.body;
  const msg = body.message;
  if (!msg) return res.status(200).send("No message");

  const text = msg.text;
  const chatId = msg.chat.id;

  let db = JSON.parse(fs.readFileSync("db.json"));

  if (text.startsWith("/useradd")) {
    const key = text.split(" ")[1];
    db.users.push({ key: key, active: true });
    fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
    await sendMessage(chatId, "Key ditambahkan ✅");
  }

  if (text.startsWith("/cek")) {
    const key = text.split(" ")[1];
    const user = db.users.find(u => u.key === key);

    if (user) {
      await sendMessage(chatId, "Key aktif ✅");
    } else {
      await sendMessage(chatId, "Key tidak ditemukan ❌");
    }
  }

  res.status(200).send("OK");
}

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });

}
