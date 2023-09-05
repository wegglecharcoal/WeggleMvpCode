/**
 * Created by charcoal on 2020. 12. 29.
 *
 * @swagger
 * /api/public/user/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [User]
 *     description: |
 *       path : /api/public/user/signup
 *
 *       * 회원가입
 *       * 해당 api 호출 전 필수 사항
 *         : 회원가입 여부 체크 필요 => /api/public/user/signup/check
 *         : 이미지 업로드 => /api/public/file
 *
 *     parameters:
 *       - in: body
 *         name: body
 *         description: |
 *           회원가입
 *         schema:
 *           type: object
 *           required:
 *             - signup_type
 *             - social_id
 *             - email
 *             - push_token
 *             - os
 *             - version_app
 *           properties:
 *             signup_type:
 *               type: string
 *               example: 'kakao'
 *               description: |
 *                 회원가입 타입
 *                 * kakao: 카카오
 *                 * naver: 네이버
 *                 * apple: 애플
 *               enum: [kakao,naver,apple]
 *             social_id:
 *               type: string
 *               example: 'kakao_a1234567890'
 *               description: 소셜 id
 *             email:
 *               type: string
 *               example: 'kakao@email.com'
 *               description: 이메일
 *             nickname:
 *               type: string
 *               example: 'nickna12'
 *               description: 닉네임
 *             about:
 *               type: string
 *               example: '한줄소개입니다.'
 *               description: 한줄소개
 *             interests:
 *               type: integer
 *               example: 69
 *               description: |
 *                 관심사(카테고리) - 비트연산
 *                 ex) (1:수제먹거리)+(4:인테리어 소품)+(64:가죽 공예) = 69
 *                 * 1: 수제 먹거리
 *                 * 2: 음료
 *                 * 4: 인테리어 소품
 *                 * 8: 악세사리
 *                 * 16: 휴대폰 주변기기
 *                 * 32: 비누/캔들
 *                 * 64: 가죽 공예
 *                 * 128: 꽃
 *                 * 256: 반려견
 *             age:
 *               type: integer
 *               example: 30
 *               description: |
 *                 나이대역
 *                 * 20: 20대 이하
 *                 * 30: 30대
 *                 * 40: 40대
 *                 * 50: 50대 이상
 *               enum: [20,30,40,50]
 *             gender:
 *               type: string
 *               example: male
 *               description: |
 *                 성별
 *                 * male: 남성
 *                 * female: 여성
 *               enum: [male,female]
 *             filename:
 *               type: string
 *               example: abcdefg.png
 *               description: |
 *                 프로필 파일명
 *                 * /api/public/file api 호출뒤 응답값인 filename 를 사용
 *             push_token:
 *               type: string
 *               example: 'asdfasdfasdfasdfasdfasdfadfsa'
 *               description: fcm 푸시 token
 *             os:
 *               type: string
 *               example: 'android'
 *               description: |
 *                 디바이스 운영체제
 *               enum: [android, ios]
 *             version_app:
 *               type: string
 *               example: '0.0.1'
 *               description: |
 *                 위글 앱 버전
 *                 * ex - 0.0.1
 *
 *     responses:
 *       200:
 *         description: 결과 정보
 *         schema:
 *           $ref: '#/definitions/User'
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

            req.innerBody['item'] = await queryCheck(req, db_connection);
            if( req.innerBody['item'] ){
                errUtil.createCall(errCode.already, `이미 회원가입한 유저입니다.`)
                return
            }

            let email_data = await queryCheckEmail(req, db_connection);
            if( email_data ){
                errUtil.createCall(errCode.already, `이미 가입한 이메일 입니다.`)
                return
            }
            let nickname_count_data = await queryCheckNickname(req, db_connection);
            if( nickname_count_data['count'] > 0 ){
                errUtil.createCall(errCode.already, `이미 사용중인 닉네임 입니다.`)
                return
            }

            req.innerBody['item'] = await query(req, db_connection);
            req.innerBody['item']['access_token'] = jwtUtil.createToken(req.innerBody['item'], '100d');
            // req.innerBody['item'] = await queryUpdate(req, db_connection);
            await queryUpdate(req, db_connection);

            if( req.paramBody['filename'] && req.paramBody['filename'].length >= 4 ){
                await queryUpdateImage(req, db_connection);
            }

            deleteBody(req);
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
    paramUtil.checkParam_noReturn(req.paramBody, 'signup_type');
    paramUtil.checkParam_noReturn(req.paramBody, 'social_id');
    paramUtil.checkParam_noReturn(req.paramBody, 'email');
    paramUtil.checkParam_noReturn(req.paramBody, 'nickname');
    paramUtil.checkParam_noReturn(req.paramBody, 'about');
    paramUtil.checkParam_noReturn(req.paramBody, 'interests');
    paramUtil.checkParam_noReturn(req.paramBody, 'age');
    paramUtil.checkParam_noReturn(req.paramBody, 'gender');
    paramUtil.checkParam_noReturn(req.paramBody, 'push_token');
    paramUtil.checkParam_noReturn(req.paramBody, 'os');
    paramUtil.checkParam_noReturn(req.paramBody, 'version_app');
}

function deleteBody(req) {
    // delete req.innerBody['item']['latitude']
    // delete req.innerBody['item']['longitude']
    delete req.innerBody['item']['push_token']
}

function query(req, db_connection) {
    const _funcName = arguments.callee.name;

    //let user_uid = req.headers['user_uid'] ? req.headers['user_uid'] : 0;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_create_user'
        , [
            req.paramBody['signup_type'],
            req.paramBody['social_id'],
            req.paramBody['email'],
            req.paramBody['nickname'],
            req.paramBody['about'],
            req.paramBody['interests'],
            req.paramBody['gender'],
            req.paramBody['age'],
            req.paramBody['push_token'],
            req.paramBody['os'],
            req.paramBody['version_app'],
        ]
    );
}

function queryCheck(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_select_user_signup_check'
        , [
            req.paramBody['signup_type'],
            req.paramBody['social_id'],
        ]
    );
}

function queryCheckNickname(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_select_user_nickname_check'
        , [
            0,
            req.paramBody['nickname'],
        ]
    );
}

function queryCheckEmail(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_select_user_email_check'
        , [
            req.headers['user_uid'],
            req.paramBody['email'],
        ]
    );
}

function queryUpdate(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_update_user_access_token'
        , [
            req.innerBody['item']['uid'],
            req.innerBody['item']['access_token'],
        ]
    );
}

function queryUpdateImage(req, db_connection) {
    const _funcName = arguments.callee.name;

    return mysqlUtil.querySingle(db_connection
        , 'call proc_create_image'
        , [
            req.innerBody['item']['uid'],
            req.innerBody['item']['uid'],
            1,  // type===1 : 유저 프로필 이미지
            req.paramBody['filename'],
        ]
    );
}

