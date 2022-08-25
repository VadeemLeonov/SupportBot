import { Composer } from 'telegraf';
import { userSupport } from './config.js';
import { isSupport } from '../index.js';

const poll = new Composer();

// Обратившиеся пользователи
const users = [];

// Создаём массивы с ответами на опрос
const pollAnswers1 = [];
const pollAnswers2 = [];
const pollAnswers3 = [];

// Проверяем есть ли пользователь в массиве
let isUser = (userId) => {
    return users.includes(userId);
};

// Добавляем пользователя 
let addUser = (userId) => {
    if (!isUser(userId) && !isSupport(userId)) {
        users.push(userId);
    }
};

// Функция заполняет массив объектами содержащими ответы на опрос
let addAnswer = ctx => {
    switch (ctx.update.poll_answer.option_ids[0]) {
        case 0:
            pollAnswers1.push(ctx.pollAnswer.user);
            break;
        case 1:
            pollAnswers2.push(ctx.pollAnswer.user);
            break;
        case 2:
            pollAnswers3.push(ctx.pollAnswer.user);
            break;
    }
};

// Достаём имена пользователей из результата опроса
let name = arr => {
    let names = [];
    arr.forEach(function(item) {
        let { first_name = '', last_name = '' } = item;
        names.push(`${first_name} ${last_name}`);
    })
    return names;
};

// Команда рассылает опрос всем обратившимся пользователям
poll.command('poll', (ctx) => {
    if (users.length > 0) {
        for (let i = userSupport.length - 1; i >= 0; i--) {
            ctx.telegram.sendPoll(users[i], 'Насколько Вам удобно пользоваться нашим ботом', ['Очень удобно', 'Удобно', 'Не удобно'], { is_anonymous: false });
        }
    }
});

//  Команда /pollAnswers возвращает результаты опроса
poll.command('pollAnswers', (ctx) => {
    ctx.reply(
        `Первый вариант
    Колличество ответов: ${pollAnswers1.length}
    ${name(pollAnswers1)}

    Второй вариант
     Колличество ответов: ${pollAnswers2.length}
    ${name(pollAnswers2)}

    Третий вариант
     Колличество ответов: ${pollAnswers3.length}
    ${name(pollAnswers3)}`);

});

// Ловим ответ на опрос
poll.on('poll_answer', (ctx) => {
    addAnswer(ctx);
})

export { poll, addUser }
