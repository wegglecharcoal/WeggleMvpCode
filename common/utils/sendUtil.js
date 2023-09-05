/**
 * Created by charcoal on 2020. 12. 21.
 */
const errCode = require('../define/errCode');

const moment = require('moment');

module.exports = {
    //성공응답 메시지 종류가 다양하다. success, create, update?, delete?
    //호출 성공/실패를 1,0으로 정했다.
    //해당 status를 code에 담아 보냈다.
    //응답 스테이터스도 다양해야 한다.
    sendSuccessPacket: function (req, res, jsonData, show_log = false){

        let os = !req.headers["os"] ? '' : req.headers["os"].toUpperCase();
        res = {
            message: 'success',
            success: 1,
            code: 200,
            data: jsonData,
        };


        jsonData['method'] = req.method;
        jsonData['url'] = req.originalUrl;

        res.status(this.code || 200);
        res.send(jsonData);

        sendSuccessLogs()
    },

    sendErrorPacket: function (req, res, err){
        let jsonData = {};

        jsonData['code'] = !(err instanceof Error) ? errCode.system : err.code;
        jsonData['message'] = !(err instanceof Error) ? err.stack : err.message;
        // jsonData['stack'] = err.stack;
        jsonData['method'] = req.method;
        jsonData['url'] = req.originalUrl;

        res.status(400);
        res.send(jsonData);

        if( !req.file_name ){
            req.file_name = '';
        }

        sendFailLogs(req, jsonData, err)
    },
}

function sendSuccessLogs(){
    let log_tag = `${moment()}, url(${req.originalUrl}), Method(${req.method})`;
    console.log(`[${log_tag}] Send sendSuccessPacket start ==================================`);
    if( show_log ){
        console.log(`[${log_tag}] Send sendSuccessPacket jsonData: ${JSON.stringify(jsonData)}`);
    }
    else {
        console.log(`[${log_tag}] Send sendSuccessPacket jsonData: hide log`);
    }
}


function sendFailLogs(req, jsonData, err){
    let log_tag = `${moment()},file(${req.file_name}),url(${req.originalUrl}),Method(${req.method})`;
    if( jsonData['code'] === errCode.system ){
        console.error(`[${log_tag}] Error sendErrorPacket start ==================================`);
        console.error(`[${log_tag}] Error sendErrorPacket headers: ${JSON.stringify(req.headers)}`);
        // console.error(`[${log_tag}] Error sendErrorPacket jsonData: ${JSON.stringify(jsonData)}`);
        console.error(`[${log_tag}] Error sendErrorPacket stack: ${err.stack}`);
    }
    else {
        console.log(`[${log_tag}] Error sendErrorPacket start ==================================`);
        console.log(`[${log_tag}] Error sendErrorPacket jsonData: ${JSON.stringify(jsonData)}`);
    }
}