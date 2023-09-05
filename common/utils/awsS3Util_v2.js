/**
 * Created by charcoal on 2020. 12. 22.
 */
const path = require('path');
const multer  = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');
const AWS = require("aws-sdk");
// const s3Storage = require('multer-sharp-s3');

const s3 = new AWS.S3();

const errCode = require('../define/errCode');

const funcUtil = require('./funcUtil');
const sendUtil = require('./sendUtil');
const errUtil = require('./errUtil');

AWS.config.update({
    accessKeyId: funcUtil.getAWSAccessKeyID(),
    secretAccessKey: funcUtil.getAWSSecretAccessKey(),
    region : funcUtil.getAWSRegion(),
});

const MAX_LENGTH_MB=20

const fileFilter = (req, file, next) => {
    // console.log('fileFilter file : '+JSON.stringify(file));
    // const isPhoto = file.mimetype.startsWith('file/');
    // if (isPhoto) {
        next(null, true); // null for error means it worked and it is fine to continue to next()
    // } else {
    //     next({ message: '이미지만 업로드 가능합니다.' }, false); // with error
    // }
};

const fileOptions = {
    // fileFilter: fileFilter,
    storage: multerS3({
        s3: s3,
        bucket: `${funcUtil.getAWSBucket()}`,
        contentType: multerS3.AUTO_CONTENT_TYPE, // 자동을 콘텐츠 타입 세팅
        acl: 'public-read', // 클라이언트에서 자유롭게 가용하기 위함
        metadata: function (req, file, cb) {
            // console.log('metadata file : '+JSON.stringify(file));
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            cb(null, getFilename(req, file));
        },
    }),
    limits: {
        fileSize: 1024 * 1024 * MAX_LENGTH_MB, // {n}mb 이하만,
        files: 1
    },
};

function getFilename(req, file){
    // console.log('key file : '+JSON.stringify(file));
    let extension = path.extname(file.originalname);
    let basename = path.basename(file.originalname, extension);        //확장자 .jpg 만 빠진 파일명을 얻어온다
    let hash_name = crypto.createHash('md5').update(Date.now()+basename).digest("hex");
    return `${hash_name}${extension}`;
}

function uploadFile(req, res, next){
    console.log('awsS3Util, uploadFile start ..............');
    let single = multer(fileOptions).single('file');
    single(req, res, function (err) {
        if(err){
            // console.log('multer err : '+JSON.stringify(err));
            console.log('awsS3Util, multer err.code : '+err.code);
            console.log('awsS3Util, multer err.stack : '+err.stack);
            // console.log('awsS3Util, multer err : '+err.message);
            if( err.code === 'LIMIT_FILE_SIZE' ){
                let _er = errUtil.createCall(errCode.system, `최대 업로드 가능한 파일 사이즈는 ${MAX_LENGTH_MB}mb 입니다.`);
                sendUtil.sendErrorPacket(req, res, _er);
            }
            else {
                sendUtil.sendErrorPacket(req, res, err);
            }
        }
        else {
            next();
        }
    })
}

exports.uploadFile = uploadFile;
