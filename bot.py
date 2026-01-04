#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Telegram бот для авторизації Ukraine GTA 5
"""

import logging
import json
import os
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

# ⚠️ НАЛАШТУВАННЯ ⚠️
BOT_TOKEN = "8506586970:AAEEhVuyML6qBI5nG3U5HlgjaN2B0pR1xeA"
ADMIN_ID = 5316593741
WHITELIST_FILE = "whitelist.json"

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ========== РОБОТА З БІЛИМ СПИСКОМ ==========

def завантажити_білий_список():
    """Завантаження білого списку з файлу"""
    try:
        if os.path.exists(WHITELIST_FILE):
            with open(WHITELIST_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Створюємо новий файл
            default_data = {
                "users": [],
                "created_at": str(datetime.now()),
                "description": "Білий список Ukraine GTA 5"
            }
            зберегти_білий_список(default_data)
            return default_data
    except Exception as e:
        logger.error(f"Помилка завантаження білого списку: {e}")
        return {"users": []}

def зберегти_білий_список(whitelist):
    """Збереження білого списку в файл"""
    try:
        with open(WHITELIST_FILE, 'w', encoding='utf-8') as f:
            json.dump(whitelist, f, indent=2, ensure_ascii=False)
        logger.info(f"Білий список збережено: {len(whitelist['users'])} користувачів")
    except Exception as e:
        logger.error(f"Помилка збереження білого списку: {e}")

def додати_до_білого_списку(user_id, username, first_name):
    """Додавання користувача до білого списку"""
    whitelist = завантажити_білий_список()
    
    # Перевіряємо, чи немає вже користувача
    for user in whitelist["users"]:
        if user["id"] == user_id:
            logger.info(f"Користувач вже в білому списку: @{username} (ID: {user_id})")
            return False
    
    # Додаємо нового користувача
    new_user = {
        "id": user_id,
        "username": username,
        "first_name": first_name,
        "added_at": str(datetime.now()),
        "added_by": "admin"
    }
    
    whitelist["users"].append(new_user)
    зберегти_білий_список(whitelist)
    
    logger.info(f"Користувача додано до білого списку: @{username} (ID: {user_id})")
    return True

def видалити_з_білого_списку(user_id):
    """Видалення користувача з білого списку"""
    whitelist = завантажити_білий_список()
    initial_count = len(whitelist["users"])
    
    whitelist["users"] = [u for u in whitelist["users"] if u["id"] != user_id]
    
    if len(whitelist["users"]) < initial_count:
        зберегти_білий_список(whitelist)
        logger.info(f"Користувача видалено з білого списку: ID: {user_id}")
        return True
    return False

def в_білому_списку(user_id):
    """Перевірка чи є користувач в білому списку"""
    whitelist = завантажити_білий_список()
    return any(user["id"] == user_id for user in whitelist["users"])

def отримати_інфо_користувача(user_id):
    """Отримання інформації про користувача з білого списку"""
    whitelist = завантажити_білий_список()
    for user in whitelist["users"]:
        if user["id"] == user_id:
            return user
    return None

# ========== КОМАНДИ БОТА ==========

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обробка команди /start"""
    user = update.effective_user
    
    welcome_text = (
        f"👋 Вітаю, {user.first_name}!\n\n"
        f"🤖 Я бот для авторизації в посібнику модератора <b>Ukraine GTA 5</b>\n\n"
        f"📋 <b>Для входу на сайт:</b>\n"
        f"1️⃣ Натисни кнопку 'Увійти через Telegram' на сайті\n"
        f"2️⃣ Якщо ти вперше - чекай підтвердження адміна\n"
        f"3️⃣ Після підтвердження можеш заходити без обмежень\n\n"
        f"🛡️ <b>Система працює так:</b>\n"
        f"• Перший вхід → потребує підтвердження\n"
        f"• Наступні входи → автоматично\n"
        f"• Адмін додає тебе в білий список\n\n"
        f"🔗 <b>Сайт:</b> https://твоя-github-страница.github.io\n"
        f"⚙️ <b>Бот:</b> @{context.bot.username}\n\n"
        f"📝 <b>Команди:</b>\n"
        f"/start - Почати роботу\n"
        f"/status - Перевірити свій статус\n"
        f"/help - Допомога"
    )
    
    await update.message.reply_text(welcome_text, parse_mode='HTML')

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help - допомога"""
    help_text = (
        f"🛠 <b>ДОСТУПНІ КОМАНДИ:</b>\n\n"
        f"<code>/start</code> - Почати роботу з ботом\n"
        f"<code>/help</code> - Ця довідка\n"
        f"<code>/status</code> - Перевірити свій статус\n\n"
        f"👑 <b>АДМІН КОМАНДИ:</b>\n"
        f"<code>/whitelist</code> - Перегляд білого списку\n"
        f"<code>/add @username</code> - Додати до білого списку\n"
        f"<code>/remove @username</code> - Видалити з білого списку\n\n"
        f"🌐 <b>ДЛЯ ВХОДУ НА САЙТ:</b>\n"
        f"1. Натисніть кнопку 'Увійти через Telegram' на сайті\n"
        f"2. Авторизуйтесь через Telegram\n"
        f"3. Чекайте підтвердження адміна\n\n"
        f"🤖 <b>Бот:</b> @{context.bot.username}"
    )
    
    await update.message.reply_text(help_text, parse_mode='HTML')

async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /status - статус користувача"""
    user = update.effective_user
    
    whitelist = завантажити_білий_список()
    user_in_list = в_білому_списку(user.id)
    user_info = отримати_інфо_користувача(user.id)
    
    status_text = (
        f"📊 <b>СТАТУС СИСТЕМИ</b>\n\n"
        f"👤 <b>Ваш статус:</b> {'✅ В білому списку' if user_in_list else '❌ Не в білому списку'}\n"
        f"📋 <b>Усього користувачів:</b> {len(whitelist['users'])}\n"
        f"🆔 <b>Ваш ID:</b> <code>{user.id}</code>\n"
        f"📝 <b>Ваш username:</b> @{user.username}\n"
    )
    
    if user_in_list and user_info:
        status_text += f"\n📅 <b>Доданий:</b> {user_info['added_at']}"
    
    if user.id == ADMIN_ID:
        status_text += f"\n\n👑 <b>Ви адміністратор!</b>\nВикористовуйте /whitelist для керування"
    
    status_text += f"\n\n<i>Для входу на сайт використовуйте кнопку на сайті.</i>"
    
    await update.message.reply_text(status_text, parse_mode='HTML')

# ========== АДМІН КОМАНДИ ==========

async def whitelist_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /whitelist - перегляд білого списку"""
    user = update.effective_user
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("⛔ <b>Ця команда тільки для адміністратора.</b>", parse_mode='HTML')
        return
    
    whitelist = завантажити_білий_список()
    
    if not whitelist["users"]:
        await update.message.reply_text("📭 <b>Білий список порожній.</b>", parse_mode='HTML')
        return
    
    users_list = []
    for i, user_data in enumerate(whitelist["users"], 1):
        users_list.append(
            f"{i}. 👤 @{user_data['username']} "
            f"(ID: <code>{user_data['id']}</code>)"
            f" - {user_data['first_name']}"
        )
    
    response = (
        f"📋 <b>БІЛИЙ СПИСОК</b> ({len(whitelist['users'])} користувачів)\n\n" +
        "\n".join(users_list) +
        f"\n\n<i>Файл: {WHITELIST_FILE}</i>\n\n"
        f"<b>Команди:</b>\n"
        f"<code>/add @username</code> - додати\n"
        f"<code>/remove @username</code> - видалити"
    )
    
    await update.message.reply_text(response, parse_mode='HTML')

async def add_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /add - додати до білого списку"""
    user = update.effective_user
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("⛔ <b>Ця команда тільки для адміністратора.</b>", parse_mode='HTML')
        return
    
    if not context.args:
        await update.message.reply_text(
            "📝 <b>Використання:</b>\n"
            "<code>/add @username</code> - додати за username\n"
            "<code>/add 123456789</code> - додати за ID\n\n"
            "<b>Приклад:</b> <code>/add @test_user</code>",
            parse_mode='HTML'
        )
        return
    
    target = context.args[0]
    
    # Якщо користувач тегує себе в чаті
    if target.startswith('@'):
        username = target[1:]
        # Шукаємо ID за username (у реальності потрібно запит до Telegram API)
        await update.message.reply_text(
            f"ℹ️ <b>Щоб додати за username потрібен ID.</b>\n\n"
            f"Запитайте у користувача його ID або використайте:\n"
            f"<code>/add 123456789</code>\n\n"
            f"ID можна дізнатись через @userinfobot",
            parse_mode='HTML'
        )
        return
    else:
        try:
            user_id = int(target)
            # Додаємо з тестовим username
            додати_до_білого_списку(user_id, "user_" + str(user_id), "Користувач")
            
            response = (
                f"✅ <b>Користувача додано до білого списку</b>\n\n"
                f"🆔 <b>ID:</b> <code>{user_id}</code>\n\n"
                f"<i>Тепер він може заходити на сайт без підтвердження.</i>"
            )
            await update.message.reply_text(response, parse_mode='HTML')
            
            # Спроба повідомити користувача
            try:
                await context.bot.send_message(
                    chat_id=user_id,
                    text=f"✅ <b>ВАС ДОДАНО ДО БІЛОГО СПИСКУ!</b>\n\n"
                         f"Тепер ви можете заходити на сайт Ukraine GTA 5 без підтвердження.\n\n"
                         f"🌐 <b>Сайт:</b> https://твоя-github-страница.github.io",
                    parse_mode='HTML'
                )
            except:
                pass
                
        except ValueError:
            await update.message.reply_text("❌ <b>Невірний формат ID.</b>", parse_mode='HTML')

async def remove_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /remove - видалити з білого списку"""
    user = update.effective_user
    
    if user.id != ADMIN_ID:
        await update.message.reply_text("⛔ <b>Ця команда тільки для адміністратора.</b>", parse_mode='HTML')
        return
    
    if not context.args:
        await update.message.reply_text(
            "📝 <b>Використання:</b>\n"
            "<code>/remove @username</code> - за username\n"
            "<code>/remove 123456789</code> - за ID",
            parse_mode='HTML'
        )
        return
    
    target = context.args[0]
    whitelist = завантажити_білий_список()
    
    removed = False
    removed_user = None
    
    if target.startswith('@'):
        username = target[1:]
        for user_data in whitelist["users"]:
            if user_data["username"] == username:
                removed_user = user_data
                whitelist["users"].remove(user_data)
                removed = True
                break
    else:
        try:
            user_id = int(target)
            for user_data in whitelist["users"]:
                if user_data["id"] == user_id:
                    removed_user = user_data
                    whitelist["users"].remove(user_data)
                    removed = True
                    break
        except ValueError:
            await update.message.reply_text("❌ <b>Невірний формат ID.</b>", parse_mode='HTML')
            return
    
    if removed and removed_user:
        зберегти_білий_список(whitelist)
        response = (
            f"✅ <b>Користувача видалено з білого списку</b>\n\n"
            f"👤 <b>Користувач:</b> @{removed_user['username']}\n"
            f"🆔 <b>ID:</b> <code>{removed_user['id']}</code>\n\n"
            f"<i>Тепер він не зможе зайти на сайт.</i>"
        )
        await update.message.reply_text(response, parse_mode='HTML')
    else:
        await update.message.reply_text(f"❌ <b>Користувача {target} не знайдено в білому списку.</b>", parse_mode='HTML')

# ========== ОСНОВНА ФУНКЦІЯ ==========

def main():
    """Основна функція запуску бота"""
    
    print("=" * 50)
    print("🤖 БОТ ДЛЯ АВТОРИЗАЦІЇ UKRAINE GTA 5")
    print("=" * 50)
    print(f"👑 Адмін ID: {ADMIN_ID}")
    print(f"📁 Файл білого списку: {WHITELIST_FILE}")
    print(f"📝 Лог файл: bot.log")
    print("=" * 50)
    print("⏳ Запуск бота...")
    
    try:
        # Створюємо додаток
        application = Application.builder().token(BOT_TOKEN).build()
        
        # Реєструємо обробники команд
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("help", help_command))
        application.add_handler(CommandHandler("status", status_command))
        application.add_handler(CommandHandler("whitelist", whitelist_command))
        application.add_handler(CommandHandler("add", add_command))
        application.add_handler(CommandHandler("remove", remove_command))
        
        # Запускаємо бота
        application.run_polling()
    except Exception as e:
        logger.error(f"Помилка запуску бота: {e}")
        print(f"❌ Помилка: {e}")
        print("Перевірте токен та підключення до інтернету")

if __name__ == '__main__':
    main()
