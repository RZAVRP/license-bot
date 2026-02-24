from flask import Flask, request, jsonify
import telebot
import json
import os

TOKEN = os.getenv("8242718121:AAFfzGw5fV3waXS2-PG3aoSULq9LBcMUl5U")
ADMIN_ID = "7972819142"  

bot = telebot.TeleBot(TOKEN)
app = Flask(__name__)
DB_FILE = "database.json"

def load_db():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)



@bot.message_handler(commands=['useradd'])
def add_user(message):
    if str(message.from_user.id) != ADMIN_ID:
        return bot.reply_to(message, "Lu bukan admin ❌")

    try:
        key = message.text.split()[1]
        db = load_db()
        db[key] = {"device": None, "active": True}
        save_db(db)
        bot.reply_to(message, f"Key {key} ditambahkan ✅")
    except:
        bot.reply_to(message, "Format: /useradd 99173618")

@bot.message_handler(commands=['cek'])
def cek_user(message):
    try:
        key = message.text.split()[1]
        db = load_db()

        if key not in db:
            return bot.reply_to(message, "Key tidak ditemukan ❌")

        data = db[key]
        status = "Aktif ✅" if data["active"] else "Nonaktif ❌"
        device = data["device"] if data["device"] else "Belum dipakai"

        bot.reply_to(message, f"""
Key: {key}
Status: {status}
Device: {device}
        """)
    except:
        bot.reply_to(message, "Format: /cek 99173618")

@bot.message_handler(commands=['deluser'])
def delete_user(message):
    if str(message.from_user.id) != ADMIN_ID:
        return bot.reply_to(message, "Lu bukan admin ❌")

    try:
        key = message.text.split()[1]
        db = load_db()

        if key in db:
            del db[key]
            save_db(db)
            bot.reply_to(message, f"Key {key} dihapus 🗑️")
        else:
            bot.reply_to(message, "Key tidak ditemukan ❌")
    except:
        bot.reply_to(message, "Format: /deluser 99173618")



@app.route("/validate", methods=["POST"])
def validate():
    data = request.json
    key = data.get("key")
    device = data.get("device")

    db = load_db()

    if key not in db:
        return jsonify({"status": "invalid"})

    if not db[key]["active"]:
        return jsonify({"status": "inactive"})

    if db[key]["device"] is None:
        db[key]["device"] = device
        save_db(db)
        return jsonify({"status": "activated"})

    if db[key]["device"] == device:
        return jsonify({"status": "ok"})

    return jsonify({"status": "used_on_other_device"})

@app.route("/")
def home():
    return "Bot Running 🚀"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
