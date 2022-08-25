import { Composer } from "telegraf";
import { userSupport, supervisor } from './config.js';
import { isSupport, isSupervisor } from '../index.js';

const commands = new Composer();

//Обработка команды /start
commands.start(ctx => {
    if (isSupport(ctx.message.from.id)) {
        ctx.reply('Добро пожаловать в чат специалистов тех. поддержки.');
    } else {
        ctx.replyWithHTML('<b>ВНИМАНИЕ!!!</b> Проверьте настройки конфиденциальности Вашего профиля в telegram. <b>Обращение в любом случае будет получено и выполнено</b>. Но мы не сможем Вас об этом уведомить. ("Настройки" => "Конфиденциальность" => "Пересылка сообщений"). В разделе "Кто может ссылаться на мой аккуант при пересылке сообщений" необходимо выбрать "Все".', { parse_mode: 'HTML' });
        ctx.replyWithPhoto({ source: './logo_support.jpg' }, { caption: 'Вас приветствует служба технической поддержки!' });
    }
});

// Ищем специалиста который захотелпокинуть чат поддержки и удаляем его из массива userSupport
// Ищем специалиста который захотелпокинуть чат руководителя и удаляем его из массива supervisor
commands.command('exit', (ctx) => {
    if (isSupport(ctx.message.from.id)) {
        userSupport.splice(userSupport.indexOf(ctx.from.id), 1);
        ctx.reply('Вы покинули чат тех. поддержки.');
    } else if (isSupervisor(ctx.message.from.id)) {
        supervisor.splice(supervisor.indexOf(ctx.from.id), 1);
        console.log(`Супервайзер: ${supervisor}`);
        ctx.reply('Вы покинули чат руководителя.');
    }
});

commands.command('link', (ctx) => {
    ctx.reply(`Мой другой проект.
    Тренажер для памяти: t.me/MemoryDevBot`);
});

commands.command('site', (ctx) => {
    ctx.reply(`Cсылка на наш официальный сайт: https://example.ru`);
});

//Обработка команды /help
commands.help(ctx => {
    if (isSupervisor(ctx.message.from.id)) {
        ctx.reply(`Вам доступны следующие команды:
        /poll - Команда рассылает опрос всем обратившимся пользователям.
        /pollAnswers - Команда возвращает результаты опроса.
        /exit для выхода из чата руководителя.
        /support для просмотра ID специалистов из чата тех. поддержки.`);
    } else if (isSupport(ctx.message.from.id)) {
        ctx.reply(`Вам доступны следующие команды:
        /poll - Команда рассылает опрос всем обратившимся пользователям.
        /pollAnswers - Команда возвращает результаты опроса.
        /exit -  для выхода из чата тех. поддержки.
        /support - для просмотра ID специалистов из чата тех. поддержки`);
    } else {
        ctx.reply('Здравствуйте! Опишите суть вашей проблемы, укажите пользователя документ с которым возникла проблема, при необходимости добавте файл или изображение, по результатам решения наши оператры Вам ответят.');
    }
});

// При отправки команды /support выводим массив с ид специалистов тех поддержки userSupport
commands.command('support', (ctx) => {
    ctx.reply(userSupport);
});

export { commands }