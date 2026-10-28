/**
 * Признаки заведомо слабого устройства для облегчённого режима (lib/perf.ts). Отдельный модуль без
 * "use client": строку скрипта встраивает серверный layout в <head>, чтобы режим включился до первой
 * отрисовки.
 */
export const PERF_ATTRIBUTE = "data-perf";

/**
 * Экономия трафика, память до 2 ГБ или до 4 ГБ при не более чем 4 ядрах. navigator.deviceMemory (ГБ,
 * округлено вниз до степени двойки) есть только в Chromium — то есть на Android.
 */
export const PERF_HINT_SCRIPT = `(function(){try{var n=navigator,m=n.deviceMemory,c=n.hardwareConcurrency,s=n.connection&&n.connection.saveData;if(s||(m&&m<=2)||(m&&m<=4&&c&&c<=4)){document.documentElement.setAttribute("${PERF_ATTRIBUTE}","lite")}}catch(e){}})();`;
