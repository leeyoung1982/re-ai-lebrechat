邮件模板运行时目录：/app/api/server/emails

镜像内模板源目录：/app/api/server/utils/emails

必须挂载：./emails -> /app/api/server/emails:ro

注册验证模板：verifyEmail.handlebars

忘记密码模板：requestPasswordReset.handlebars、passwordReset.handlebars

升级/重建后如邮件异常，先查 ENOENT *.handlebars