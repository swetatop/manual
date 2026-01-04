import logging
import json
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# ⚠️ НАСТРОЙКИ ⚠️
BOT_TOKEN = "8506586970:AAEEhVuyML6qBI5nG3U5HlgjaN2B0pR1xeA"
ADMIN_ID = 5316593741  # Твой chat_id
WHITELIST_FILE = "whitelist.json"

# Настройка логирования
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Загрузка белого списка
def load_whitelist():
    try:
        with open(WHITELIST_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"users": []}

# Сохранение белого списка
def save_whitelist(whitelist):
    with open(WHITELIST_FILE, 'w') as f:
        json.dump(whitelist, f, indent=2)

# Добавление в белый список
def add_to_whitelist(user_id, username):
    whitelist = load_whitelist()
    
    # Проверяем, нет ли уже пользователя
    for user in whitelist["users"]:
        if user["id"] == user_id:
            return False
    
    # Добавляем нового пользователя
    whitelist["users"].append({
        "id": user_id,
        "username": username,
        "added_at": str(datetime.now())
    })
    
    save_whitelist(whitelist)
    return True

# Проверка в белом списке
def is_whitelisted(user_id):
    whitelist = load_whitelist()
    return any(user["id"] == user_id for user in whitelist["users"])

# Команда /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    await update.message.reply_text(
        f"👋 Привіт, {user.first_name}!\n\n"
        f"Я бот для авторизації в посібнику модератора Ukraine GTA5.\n\n"
        f"ℹ️ Для входу на сайт:\n"
        f"1. Натисни кнопку 'Увійти через Telegram' на сайті\n"
        f"2. Якщо ти вперше - чекай підтвердження адміна\n"
        f"3. Після підтвердження можеш заходити без обмежень\n\n"
        f"🛡️ Адмін: @{context.bot.username}"
    )

# Команда /login (для запроса доступа)
async def login_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    # Проверяем, есть ли уже в белом списке
    if is_whitelisted(user.id):
        await update.message.reply_text(
            f"✅ Ви вже маєте доступ до сайту!\n\n"
            f"Можете заходити на сайт без додаткових підтверджень.\n"
            f"Ваш нік: {user.first_name}\n"
            f"Username: @{user.username}"
        )
        return
    
    # Если нет в белом списке - создаем запрос админу
    keyboard = [
        [
            InlineKeyboardButton("✅ Дозволити", callback_data=f"approve_{user.id}_{user.username}"),
            InlineKeyboardButton("❌ Відхилити", callback_data=f"reject_{user.id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Отправляем админу
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=f"🔐 НОВИЙ ЗАПИТ НА ДОСТУП!\n\n"
             f"👤 Користувач: {user.first_name}\n"
             f"📱 Username: @{user.username}\n"
             f"🆔 ID: {user.id}\n\n"
             f"Це перший вхід цього користувача.\n"
             f"Після підтвердження він потрапить у білий список.\n\n"
             f"Дозволити доступ?",
        reply_markup=reply_markup
    )
    
    await update.message.reply_text(
        f"📨 Запит на доступ відправлено адміністратору.\n\n"
        f"ℹ️ Після підтвердження ви зможете заходити на сайт без додаткових запитів.\n\n"
        f"Очікуйте підтвердження від адміністратора."
    )

# Обработка кнопок админа
async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data
    parts = data.split('_')
    
    if data.startswith("approve"):
        user_id = int(parts[1])
        username = parts[2] if len(parts) > 2 else "користувач"
        
        # Добавляем в белый список
        add_to_whitelist(user_id, username)
        
        # Уведомляем пользователя
        await context.bot.send_message(
            chat_id=user_id,
            text=f"✅ ВАШ ДОСТУП ПІДТВЕРДЖЕНО!\n\n"
                 f"Вітаємо, {username}!\n\n"
                 f"🛡️ Тепер ви в білому списку.\n"
                 f"🔓 Можете заходити на сайт без додаткових підтверджень.\n\n"
                 f"🌐 Сайт: https://ваш-сайт.com\n"
                 f"👤 Ваш нік: {username}\n\n"
                 f"Збережіть це повідомлення."
        )
        
        # Уведомляем админа
        await query.edit_message_text(
            text=f"✅ КОРИСТУВАЧА ДОДАНО ДО БІЛОГО СПИСКУ!\n\n"
                 f"👤 Користувач: @{username}\n"
                 f"🆔 ID: {user_id}\n\n"
                 f"Тепер він може заходити на сайт без підтвердження.",
            reply_markup=None
        )
        
        logger.info(f"Користувача додано до білого списку: @{username} (ID: {user_id})")
    
    elif data.startswith("reject"):
        user_id = int(parts[1])
        
        # Уведомляем пользователя
        await context.bot.send_message(
            chat_id=user_id,
            text="❌ Ваш запит на доступ відхилено адміністратором.\n\n"
                 "Якщо вважаєте, що це помилка - зверніться до адміністратора."
        )
        
        # Уведомляем админа
        await query.edit_message_text(
            text="❌ Запит відхилено.",
            reply_markup=None
        )

# Команда /whitelist (для админа)
async def whitelist_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("⛔ Ця команда тільки для адміністратора.")
        return
    
    whitelist = load_whitelist()
    
    if not whitelist["users"]:
        await update.message.reply_text("📭 Білий список порожній.")
        return
    
    users_list = "\n".join([f"👤 @{u['username']} (ID: {u['id']})" for u in whitelist["users"]])
    
    await update.message.reply_text(
        f"📋 БІЛИЙ СПИСОК ({len(whitelist['users'])} користувачів):\n\n{users_list}"
    )

# Команда /remove (удалить из белого списка)
async def remove_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("⛔ Ця команда тільки для адміністратора.")
        return
    
    if not context.args:
        await update.message.reply_text("Використання: /remove @username або /remove user_id")
        return
    
    target = context.args[0]
    whitelist = load_whitelist()
    
    # Ищем пользователя
    removed = False
    if target.startswith('@'):
        username = target[1:]
        whitelist["users"] = [u for u in whitelist["users"] if u["username"] != username]
        removed = True
    else:
        try:
            user_id = int(target)
            whitelist["users"] = [u for u in whitelist["users"] if u["id"] != user_id]
            removed = True
        except ValueError:
            await update.message.reply_text("Невірний формат ID.")
            return
    
    if removed:
        save_whitelist(whitelist)
        await update.message.reply_text(f"✅ Користувача {target} видалено з білого списку.")
    else:
        await update.message.reply_text(f"❌ Користувача {target} не знайдено в білому списку.")

# Главная функция
def main():
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики команд
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("login", login_command))
    application.add_handler(CommandHandler("whitelist", whitelist_command))
    application.add_handler(CommandHandler("remove", remove_command))
    application.add_handler(CallbackQueryHandler(button_handler))
    
    # Запускаем бота
    print("🤖 Бот Ukraine GTA5 Auth запущено...")
    print(f"👑 Адмін: {ADMIN_ID}")
    print(f"📁 Файл білого списку: {WHITELIST_FILE}")
    print("⏳ Чекаю запитів...")
    
    application.run_polling()

if __name__ == '__main__':
    main()
