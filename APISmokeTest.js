var newman = require('newman'); 
var nodemailer  = require('nodemailer');
var fs = require('fs');
var http=require('http');

var export_file = './htmlResults_for_mail.html';
var export_file_junit = './junit.xml';
var collection_file = './API.postman_collection.json';
var env_file = './postman_environment.json';
//var to_success = 'jiteng@inspur.com;zhangsiqiao@inspur.com';
//var to_failure = 'mayantang@inspur.com;hljun@inspur.com;liuyuheng@inspur.com;jiteng@inspur.com;zhangsiqiao@inspur.com;lijia_lc@inspur.com;mazhenrj@inspur.com;hujianren@inspur.com;lixiliang01@inspur.com;maotiezhu@inspur.com';
var to_success = 'jiteng@inspur.com';
var to_failure = 'jiteng@inspur.com';
var user = '844563792@qq.com';
// 这里密码不是qq密码，是你设置的smtp授权码
var pass = '';
var from_success = '扫码接口监控--成功 <844563792@qq.com>';
var from_fail = '扫码接口监控--失败 <844563792@qq.com>';
var from_error = '扫码接口监控--异常 <844563792@qq.com>';

var args = process.argv.splice(2)

pass = args[0]
receiver = args[1]

if(receiver=='leader'){
    to_success = 'jiteng@inspur.com;songmingming@inspur.com';
    to_failure = 'jiteng@inspur.com;songmingming@inspur.com';
}

// call newman.run to pass `options` object and wait for callback 
newman.run({
    collection: require(collection_file),
    reporters: ['html','junit'],
    reporter : { html : { export : export_file,template: './template.hbs'}, junit : { export : export_file_junit}} ,
    environment: require(env_file)
}, function (err,summary) {
    if (err) { 
        sendError();
        console.error('error:'+err);
        throw err;
    }
    else if(summary.error){
        sendError();
        console.error('summary.error:'+summary.error);
        throw summary.error;
    }
    else{
        console.log('collection run complete!');

        var network_total = summary['run']['stats']['requests']['total'];
        var network_failed = summary['run']['stats']['requests']['failed'];
        var network_success = network_total - network_failed;
    
        var unit_total = summary['run']['stats']['assertions']['total'];
        var unit_failed = summary['run']['stats']['assertions']['failed'];
        var unit_success = unit_total - unit_failed;
        var stats = "接口调用"+network_total+"次，成功"+network_success+"次，失败"+network_failed+"次。\n共执行测试用例"+unit_total+"次，成功"+unit_success+"次，失败"+unit_failed+"次";
    
        var tracelog = JSON.stringify(summary, null, 2);

        var arr = summary['run']['failures'];
        var test_names_failures='';
        for ( var i = 0; i <arr.length; i++){
            test_names_failures=test_names_failures+(i+1)+'、'+'用例名称：'+arr[i].error.test+'。 执行信息：'+arr[i].error.message+';'+' '+'\r\n';
        }
    
        if(network_failed==0 && unit_failed==0){
	    http.get("http://106.ihuyi.com/webservice/sms.php?method=Submit&account=C19358916&password=1a7b83c02e490938aa6f24b17428361e&mobile=15253197573&content=您的验证码是：999999。请不要把验证码泄露给其他人。&format=json");
            sendSuccess(stats,tracelog,test_names_failures);
        }
        else{
            sendFailed(stats,tracelog,test_names_failures);
        }
    }
});

function sendSuccess(sub,tracelog,test_names_failures){
    var transporter = nodemailer.createTransport({
      service: 'qq', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
      port: 465, // SMTP 端口
      secureConnection: true, // 使用了 SSL
      auth: {
        user: user,
        pass: pass,
      }
	});
    
    var html = fs.readFileSync(export_file);
    
    var mailOptions = {
        from: from_success,
        to: to_success,
        subject: "扫码接口监控--运行测试报告--无失败信息："+sub,
        html:html
	};

    transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			throw error;
		} else {
			fn();
		}
	});
	
	console.log('emmail sent complete - success!');
}
function sendFailed(sub,tracelog,test_names_failures){
    var transporter = nodemailer.createTransport({
      service: 'qq', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
      port: 465, // SMTP 端口
      secureConnection: true, // 使用了 SSL
      auth: {
        user: user,
        pass: pass,
      }
	});
    
    var html = fs.readFileSync(export_file);

	var mailOptions = {
		from: from_fail,
		to: to_failure,
		subject: "扫码接口监控--运行测试报告--有失败信息，请及时查看！！："+sub,
        html:html,
        attachments:[
                {   
                    filename: '失败信息.txt',
                    content: test_names_failures,
                    contentType: 'text/plain'
                }
        ],
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			throw error;
		} else {
			fn();
		}
	});
	
	console.log('emmail sent complete - failed!');
}
function sendError(){
    var transporter = nodemailer.createTransport({
      service: 'qq', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
      port: 465, // SMTP 端口
      secureConnection: true, // 使用了 SSL
      auth: {
        user: user,
        pass: pass,
      }
	});
    
    var html = fs.readFileSync(export_file);

	var mailOptions = {
		from: from_error,
		to: to_failure,
		subject: "扫码接口监控--运行报告--服务器没有响应，请及时查看！！",
        text:"扫码接口监控--运行报告--服务器没有响应，请及时查看！！"
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			throw error;
		} else {
			fn();
		}
	});
	
	console.log('emmail sent complete - error!');
}
