import  'dotenv/config';
import express from 'express';
import { userSupport, supervisor } from './composers/config.js';
import { Telegraf, Markup, Context } from 'telegraf';
import { commands } from './composers/commands.js';
import { poll, addUser } from './composers/poll.js';

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(commands);
bot.use(poll);

// Проверяем пользователя на права
let isSupport = (userId) => {
    return userSupport.includes(userId);
};

// Добавляем специалиста поддержки
let addUserSupport = (userId, ctx) => {
    if (!isSupervisor(userId) && !isSupport(userId)){
        userSupport.push(userId);
        ctx.reply('Вы авторизовались как специалист поддержки.');
    } else if (isSupervisor(userId)) {
        ctx.reply('Вы уже авторизованы как руководитель. Для авторизации в роли специалиста тех. поддержки Вам необходимо выйти из режима руководителя отправив команду /exit');
    }
};

// Проверяем пользователя на права руководителя
let isSupervisor = (userId) => {
    return supervisor.includes(userId);
};

// Добавляем руководителя
let addSupervisor = (userId, ctx) => {
    if (!isSupervisor(userId) && !isSupport(userId)) {
        supervisor.push(userId);
        ctx.reply('Вы авторизовались как руководитель');
    } else if (isSupport(userId)) {
        ctx.reply('Вы уже авторизованы в роли специалиста тех. поддержки. Для авторизации в роли руководителя Вам необходимо выйти из режима тех. поддержки отправив команду /exit');
    }
};

// Перенаправляем поддержке от пользователя или уведомляем поддержку об ошибке
let forwardToSupport = (ctx) => {
    //Перенаправляем руководителю
    if (isSupervisor(ctx.from.id)) {
        return;
    } else {
        for (let i = supervisor.length - 1; i >= 0; i--) {
            ctx.forwardMessage(supervisor[i], ctx.from.id, ctx.message.id);
        }
    }
    // Перенаправляем поддержке
    if (isSupport(ctx.from.id)) {
        ctx.reply("Для ответа пользователю используйте функцию Ответить/Reply.");
    } else {
        for (let i = userSupport.length - 1; i >= 0; i--) {
            ctx.forwardMessage(userSupport[i], ctx.from.id, ctx.message.id);
        }
    }
};

// Перенаправляем ответ от поддержки
let forwardReply = (ctx, users) => {
    for (let i = users.length - 1; i >= 0; i--) {
        if (ctx.from.id !== users[i]) {
            ctx.message.photo ? ctx.telegram.sendPhoto(users[i], ctx.message.photo[1].file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) :
            ctx.message.audio ? ctx.telegram.sendAudio(users[i], ctx.message.audio.file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) :
            ctx.message.voice ? ctx.telegram.sendVoice(users[i], ctx.message.voice.file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) :
            ctx.message.animation ? ctx.telegram.sendAnimation(users[i], ctx.message.animation.file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) :
            ctx.message.video ? ctx.telegram.sendVideo(users[i], ctx.message.video.file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) :
            ctx.message.document ? ctx.telegram.sendDocument(users[i], ctx.message.document.file_id, { caption: `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}` }, { reply_to_message_id: ctx.message.message_id }) : false;
            ctx.telegram.sendMessage(users[i], `от: ${first_name(ctx)} ${last_name(ctx)}, кому: ${ctx.message.reply_to_message.forward_from.first_name}
${msgText(ctx)}${msgCaption(ctx)}`);
        }
    }
}

// Если пользователь ввел пароль, то заносим в группу специалист поддержки
bot.hears(process.env.PASS, ctx => {
    addUserSupport(ctx.message.from.id, ctx);
    console.log(`Специалисты тех. поддержки: ${userSupport}`);
});

bot.hears(process.env.SUPER, ctx => {
    addSupervisor(ctx.message.from.id, ctx);
    console.log(`Супервайзер: ${supervisor}`);
});


//  Проверяем наличие имени и фамилии для подписи пересланного сообщения поддержке
let first_name = (ctx) => ctx.from.first_name ? ctx.from.first_name : ctx.from.first_name = " ";
let last_name = (ctx) => ctx.from.last_name ? ctx.from.last_name : ctx.from.last_name = " ";
let msgText = (ctx) => ctx.message.text ? ctx.message.text : ctx.message.text = " ";
let msgCaption = (ctx) => ctx.message.caption ? ctx.message.caption : ctx.message.caption = "";

// Слушаем на наличие объекта message
bot.on('message', (ctx) => {
    // Добавляем пользователя для рассылки опроса
    addUser(ctx.from.id);
    // убеждаемся что это специалист поддержки ответил на сообщение пользователя
    if (ctx.message.reply_to_message &&
        ctx.message.reply_to_message.chat.id &&
        isSupport(ctx.from.id)) {
        // отправляем копию пользователю
        try {
            ctx.telegram.copyMessage(ctx.message.reply_to_message.forward_from.id, ctx.from.id, ctx.message.message_id);
            // Пересылаем ответ от поддержки всей поддержке, кроме отправителя, и руководителю
            forwardReply(ctx, userSupport);
            forwardReply(ctx, supervisor);
    
        } catch (err) {
            console.error(err);
            ctx.reply('Пользователь запретил отвечать на пересылаемое сообщение.');
        }
    } else {
        // перенаправляем поддержке
        try {
            //С проверкой на бота
            (!ctx.message.from.is_bot) ? forwardToSupport(ctx) : false;
        } catch (err) {
            console.error(err);
            ctx.reply('Ошибка! Сообщение в поддержку не доставлено!');
        }
        
    }
});

bot.launch();
console.log(`Специалисты тех. поддержки: ${userSupport}`);
console.log(`Рукводитель: ${supervisor}`);


export { isSupport, isSupervisor }