import _ from 'lodash';
import superagent from 'superagent';
import logger from './logger';

const RETRY = 3;

class MpApi {
  appid: string;
  secret: string;
  accessToken: string;

  constructor(appid: string, secret: string) {
    this.appid = appid;
    this.secret = secret;
  }

  async getAccessToken() {
    if (!_.isEmpty(this.accessToken)) {
      return this.accessToken;
    }
    
    let i = 0;
    while (i < RETRY) {
      const response = await superagent.get('https://api.weixin.qq.com/cgi-bin/token')
      .query({
        'grant_type': 'client_credential',
        'appid': this.appid,
        'secret': this.secret
      });

      logger.debug(`getAccessToken ${response.text}`);
      const resObj = JSON.parse(response.text);

      if (_.isEmpty(resObj.errcode)) {
        this.accessToken = resObj['access_token'];
        return this.accessToken;
      }

      i++;
      logger.debug(`Retry...${i}`);
    }
  }

  async postDraft(title: string, content: string) {
    const accessToken = await this.getAccessToken();

    const response = await superagent.post('https://api.weixin.qq.com/cgi-bin/draft/add')
      .query({
        'access_token': accessToken
      })
      .send({
        'articles': [
          {
            'title': title,
            'author': '你们的7-904邻居',
            'content': content,
            'digest': '请查收今日网签报告',
            'thumb_media_id': 'Zps6GV5-orJ-GKLBPnXjZxBPt040TZa3-e5pk-Na-D4-G5UR2A8t4MeJwEbW-l0h',
            'need_open_comment': 0,
            'only_fans_can_comment': 0
          }
        ]
      });

    logger.debug(`postDraft ${response.text}`);
    const resObj = JSON.parse(response.text);
    return resObj;
  }

  async uploadImg(path: string) {
    const accessToken = await this.getAccessToken();

    const response = await superagent.post('https://api.weixin.qq.com/cgi-bin/media/uploadimg')
      .query({
        'access_token': accessToken
      })
      .attach('media', path);

    logger.debug(`uploadImg ${response.text}`);
    const resObj = JSON.parse(response.text);
    return resObj.url;
  }
}

export default MpApi;