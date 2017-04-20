const handler = require('./handler');

handler.hello({
    "resource": "/twilio/zork",
    "path": "/twilio/zork",
    "httpMethod": "POST",
    "headers": {
        "Accept": "*/*",
        "Cache-Control": "max-age=259200",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-Mobile-Viewer": "false",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "US",
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": "cajt2arr39.execute-api.us-east-1.amazonaws.com",
        "User-Agent": "TwilioProxy/1.1",
        "Via": "1.1 e3228acb4b07b21eba94234a10678aed.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "NZhSc2gUlL9HhAbtwLh2YxqzGD6_CRzpj4xO5oilq_YzC2qqHs-8hQ==",
        "X-Amzn-Trace-Id": "Root=1-58f90b2f-15f723290dcff9bf18325f84",
        "X-Forwarded-For": "54.82.233.155, 54.240.144.11",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https",
        "X-Twilio-Signature": "1nH+/5KdDaLyKsWcUgROJL0xXSM="
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "stageVariables": null,
    "requestContext": {
        "accountId": "546375621904",
        "resourceId": "ei4d7r",
        "stage": "dev",
        "requestId": "20f5fe64-25ff-11e7-8eac-831e1a6a37a6",
        "identity": {
            "cognitoIdentityPoolId": null,
            "accountId": null,
            "cognitoIdentityId": null,
            "caller": null,
            "apiKey": null,
            "sourceIp": "54.82.233.155",
            "accessKey": null,
            "cognitoAuthenticationType": null,
            "cognitoAuthenticationProvider": null,
            "userArn": null,
            "userAgent": "TwilioProxy/1.1",
            "user": null
        },
        "resourcePath": "/twilio/zork",
        "httpMethod": "POST",
        "apiId": "cajt2arr39"
    },
    "body": "ToCountry=US&ToState=MI&SmsMessageSid=SM1f6e6840dca4e0432836d2928fc080ab&NumMedia=0&ToCity=SOUTHFIELD&FromZip=32751&SmsSid=SM1f6e6840dca4e0432836d2928fc080ab&FromState=FL&SmsStatus=received&FromCity=MAITLAND&Body=Another+test&FromCountry=US&To=%2B12485042307&MessagingServiceSid=MG9f6e8854ea445b35fc0fd5b0431699bd&ToZip=48034&NumSegments=1&MessageSid=SM1f6e6840dca4e0432836d2928fc080ab&AccountSid=ACc4bbd3e069ae681b607b2281aa8eb335&From=%2B14077968555&ApiVersion=2010-04-01",
    "isBase64Encoded": false
}, null, (err, res) => {
    console.log(res);
});