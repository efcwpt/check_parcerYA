const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

(async () => {
    // Чтение номеров из файла
    const numbers = fs.readFileSync('nomera.txt', 'utf-8')
        .split('\n')
        .map(n => n.trim())
        .filter(n => n.length > 0);

    // Создаем или очищаем файл результатов
    fs.writeFileSync('input.txt', '');
    
    // Запуск браузера
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files (x86)\\Yandex\\YandexBrowser\\Application\\browser.exe',
        args: ['--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    
    // Создаем интерфейс для ручного ввода
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Функция для ручной остановки при капче
    async function handleCaptcha() {
        console.log('\x1b[31m%s\x1b[0m', 'Обнаружена капча! Решите ее в браузере и нажмите Enter в консоли...');
        
        // Ждем ввода пользователя
        await new Promise(resolve => {
            rl.question('После решения капчи нажмите Enter...', () => {
                resolve();
            });
        });
        
        console.log('Продолжаем работу...');
    }

    // Обработка каждого номера
    for (const number of numbers) {
        console.log(`Обработка номера: ${number}`);
        
        try {
            // Действие 1: Открыть Яндекс
            await page.goto('https://ya.ru', {waitUntil: 'networkidle2'});
            console.log('Открыт Яндекс');

            // Проверка на капчу
            const isCaptcha = await page.evaluate(() => {
                return document.querySelector('#captcha, .CheckboxCaptcha') !== null;
            });
            
            if (isCaptcha) {
                await handleCaptcha();
                // После решения капчи обновляем страницу
                await page.reload();
            }

            // Действие 2: Кликнуть в поисковую строку
            await page.waitForSelector('input.search3__input', {timeout: 500});
            await page.click('input.search3__input');
            console.log('Клик в поисковую строку');

            // Действие 3: Ввести текст
            await page.type('input.search3__input', number, {delay: 10});
            console.log(`Текст "${number}" введен`);

            // Действие 4: Нажать Enter
            await page.keyboard.press('Enter');
            console.log('Нажат Enter');

            // Проверка на капчу после поиска
            const isCaptchaAfterSearch = await page.waitForSelector('#captcha, .CheckboxCaptcha', {timeout: 400}).catch(() => false);
            if (isCaptchaAfterSearch) {
                await handleCaptcha();
            }

            // Действие 5: Дождаться результатов
            await page.waitForSelector('.serp-item', {timeout: 200});
            console.log('Результаты загружены');

            // Действие 6: Проверить наличие спам-меток
            const content = await page.content();
            const spamPatterns = [
                'Нежелательный звонок. Есть жалобы.',
                'Предложение товаров и услуг',
                'Подозрение на мошенничество'
            ];
            
            const isSpam = spamPatterns.some(pattern => 
                content.toLowerCase().includes(pattern.toLowerCase())
            );
            
           // Записать результат в файл
                      const result = `${number} - ${isSpam ? 'спам' : 'чистый'}\n`;
                      fs.appendFileSync('input.txt', result);
                      console.log(`Результат записан: ${result.trim()}`);

        } catch (error) {
            console.error(`Ошибка при обработке номера ${number}: ${error}`);
            // Сохраняем ошибку с высшим приоритетом (1)
            results.push({
                number,
                status: 'ошибка',
                type: 1
            });
        }
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Закрыть браузер
    await browser.close();
    rl.close();
    console.log('Браузер закрыт');
    
    
    // Формируем строку для записи
    const outputContent = results.map(item => `${item.number} - ${item.status}`).join('\n');
    
    // Записываем в файл
    fs.writeFileSync('input.txt', outputContent);
    console.log('Результаты отсортированы и сохранены в input.txt');
    
    // Дополнительный вывод в консоль
    console.log('\nИтоговые результаты:');
    console.log(outputContent);
})();