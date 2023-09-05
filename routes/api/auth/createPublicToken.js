/**
 * Created by charcoal on 2021. 01. 08.
 *
 * @swagger
 * /api/public/auth/token:
 *   get:
 *     summary: public token 발급
 *     tags: [Auth]
 *     description: |
 *       path : /api/public/auth/token
 *
 *       * public token 발급
 *
 *     responses:
 *       200:
 *         description: 결과 예시
 *         schema:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: asdklasdmklwmdkalsdjmkawmklsad
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
const jwtUtil = require('../../../common/utils/jwtUtil');

const errCode = require('../../../common/define/errCode');

let file_name = fileUtil.name(__filename);

const createToken = function (req, res) {
    const _funcName = arguments.callee.name;

    try{
        req.innerBody = {};

        req.innerBody['token'] = jwtUtil.createPublicToken();

        //응답 데이터가 성공이라는 모델을 보내줘야 한다.

        return sendUtil.sendSuccessPacket(req, res, req.innerBody, true);

    }
    catch (e) {
        let _err = errUtil.get(e);
        sendUtil.sendErrorPacket(req, res, _err);
        return 
    }
}
module.exports = {
    createToken,
}
