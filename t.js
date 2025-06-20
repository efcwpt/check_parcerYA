const puppeteer = require('puppeteer');
const fs = require('fs');

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
    
    // Обработка каждого номера
    for (const number of numbers) {
        console.log(`Обработка номера: ${number}`);
        
        try {
            // Действие 1: Открыть Яндекс
            await page.goto('https://ya.ru');
            console.log('Открыт Яндекс');

            // Действие 2: Кликнуть в поисковую строку
            await page.waitForSelector('input.search3__input', {timeout: 5000});
            await page.click('input.search3__input');
            console.log('Клик в поисковую строку');

            // Действие 3: Ввести текст
            await page.type('input.search3__input', number, {delay: 10});//было 100
            console.log(`Текст "${number}" введен`);

            // Действие 4: Нажать Enter
            await page.keyboard.press('Enter');
            console.log('Нажат Enter');

            // Действие 5: Дождаться результатов
            await page.waitForSelector('.serp-item', {timeout: 600});//было 10000
            console.log('Результаты загружены');

           // Действие 6: Проверить наличие спам-меток
            const content = await page.content();
            const spamPatterns = [
                'Нежелательный звонок. Есть жалобы.',
                'Предложение товаров и услуг',
                'Подозрение на мошенничество'
            ];
            
            const isSpam = spamPatterns.some(pattern => content.includes(pattern));
            
            // Записать результат в файл
            const result = `${number} - ${isSpam ? 'спам' : 'чистый'}\n`;
            fs.appendFileSync('input.txt', result);
            console.log(`Результат записан: ${result.trim()}`);

        } catch (error) {
            console.error(`Ошибка при обработке номера ${number}: ${error}`);
            fs.appendFileSync('input.txt', `${number} - ошибка\n`);
        }
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 200));//было 2000
    }

    // Закрыть браузер
    await browser.close();
    console.log('Браузер закрыт');
})();