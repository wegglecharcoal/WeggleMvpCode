/**
 * Created by charcoal on 2021. 01. 08.
 *
 * @swagger
 * /api/private/video/count/shared:
 *   put:
 *     summary: 영상 공유 횟수 업데이트
 *     tags: [Video]
 *     description: |
 *       path : /api/private/video/count/shared
 *
 *       * 영상 공유 횟수 업데이트
 *
 *     parameters:
 *       - in: body
 *         name: body
 *         description: |
 *           영상 공유 횟수 업데이트
 *         schema:
 *           type: object
 *           required:
 *             - video_uid
 *           properties:
 *             video_uid:
 *               type: number
 *               example: 1
 *               description: |
 *                 영상 uid
 *
 *     responses:
 *       400:
 *         description: 에러 코드 400
 *         schema:
 *           $ref: '#/definitions/Error'
 */

const paramUtil = require('../../../common/utils/paramUtil');
const fileUtil = require('../../../common/utils/fileUtil');
const mysqlUtil = require('../../../common/utils/mysqlUtil');
const sendUtil = require('../../../common/utils/sendUtil');
const errUtil = require('../../../common/utils/errUtil');
const logUtil = require('../../../common/utils/logUtil');

let file_name = fileUtil.name(__filename);

module.exports = function (req, res) {
    const _funcName = arguments.callee.name;

    try{
        req.file_name = file_name;
        // logUtil.printUrlLog(req, `== function start ==================================`);
        logUtil.printUrlLog(req, `header: ${JSON.stringify(req.headers)}`);
        req.paramBody = paramUtil.parse(req);
        // logUtil.printUrlLog(req, `param: ${JSON.stringify(req.paramBody)}`);

        checkParam(req);

        mysqlUtil.connectPool( async function (db_connection) {
            req.innerBody = {};

            req.innerBody['item'] = await query(req, db_connection);

            deleteBody(req)
            sendUtil.sendSuccessPacket(req, res, req.innerBody, true);

        }, function (err) {
            sendUtil.sendErrorPacket(req, res, err);
        } );

    }
    catch (e) {
        let _err = errUtil.get(e);
        sendUtil.sendErrorPacket(req, res, _err);
    }
}

function checkParam(req) {
    paramUtil.checkParam_noReturn(req.paramBody, 'video_uid');
}

function deleteBody(req) {
    // delete req.innerBody['item']['latitude']
}

function query(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_update_video_count_shared'
        , [
            // req.headers['user_uid'],
            req.paramBody['video_uid'],
        ]
    );
}

