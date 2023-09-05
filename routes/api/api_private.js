/**
 * Created by charcoal on 2021. 01. 21.
 */
const express = require('express');
const app = express();


/**
 * user api
 */
app.route('/user').put( require('./user/updateUser') )
app.route('/user/info/me').get( require('./user/selectUserInfoMe') )
app.route('/user/info/other').get( require('./user/selectUserInfoOther') )
app.route('/user/profile/review/list').get( require('./user/selectUserProfileReviewList') )

/**
 * feed api
 */
app.route('/feed/list').get( require('./feed/selectFeedList') )

/**
 * video api
 */
app.route('/video/info').get( require('./video/selectVideoInfo') )
app.route('/video/review/list').get( require('./video/selectVideoReviewList') )
app.route('/video/count/shared').put( require('./video/updateVideoCountShared') )
app.route('/video/count/view').put( require('./video/updateVideoCountView') )
app.route('/video/review')
    .post( require('./video/createVideoReview') )
    .delete( require('./video/deleteVideoReview') )

/**
 * comment api
 */
app.route('/comment')
    .post( require('./comment/createComment') )
    .delete( require('./comment/deleteComment') )
app.route('/comment/list').get( require('./comment/selectCommentList') )

/**
 * like api
 */
app.route('/like').put( require('./like/updateLike') )
app.route('/like/product/list').get( require('./like/selectLikeProductList') )

/**
 * follow api
 */
app.route('/follow')
    .delete( require('./follow/deleteFollow') )
    .post( require('./follow/createFollow') )
app.route('/follow/list').get( require('./follow/selectFollowList') )




module.exports = app;
