const http = require('http');

// 测试用户提供的登录参数
function testUserLogin() {
  return new Promise((resolve, reject) => {
    const loginData = {
      tenantSlug: "a",
      username: "a",
      password: "a"
    };

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(loginData).length
      }
    };

    console.log('=== 测试用户登录参数的响应格式 ===');
    console.log('请求数据:', JSON.stringify(loginData, null, 2));

    const req = http.request(options, (res) => {
      console.log('状态码:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('\n响应格式检查:');
          console.log('- 是否有 code 字段:', 'code' in response);
          console.log('- 是否有 msg 字段:', 'msg' in response);
          console.log('- 是否有 data 字段:', 'data' in response);
          console.log('- code 值:', response.code);
          console.log('- msg 值:', response.msg);
          console.log('\n完整响应:', JSON.stringify(response, null, 2));
          
          // 检查是否符合标准格式
          if ('code' in response && 'msg' in response && 'data' in response) {
            console.log('\n✅ 响应格式符合标准：{code, msg, data}');
            console.log('✅ code = 0 表示成功，其他值表示错误');
            
            if (response.code === 0) {
              console.log('🎉 登录成功！');
            } else {
              console.log('❌ 登录失败，错误码:', response.code, '错误信息:', response.msg);
            }
          } else {
            console.log('\n❌ 响应格式不符合标准');
          }
          
          resolve(response);
        } catch (e) {
          console.log('JSON解析失败:', data);
          resolve({ error: '无法解析响应' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('请求错误:', e.message);
      reject(e);
    });

    req.write(JSON.stringify(loginData));
    req.end();
  });
}

// 执行测试
testUserLogin().catch(console.error); 