#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
公司文档导入脚本 - 将 docs 目录下的文档导入到 RAG 知识库

使用方法：
1. 将要导入的文档放入 ./docs 目录
2. 确保 rag_api 服务正在运行（docker-compose up -d）
3. 运行此脚本：python3 ingest_company_docs.py

支持的文件格式：.txt, .md, .pdf, .doc, .docx, .csv, .json 等
"""

import os
import requests
from pathlib import Path
import mimetypes
import jwt
import time

# 配置
RAG_API_URL = "http://localhost:8000/embed"
COLLECTION_NAME = "kb_company"
DOCS_DIR = "./docs"

# 从 .env 文件读取配置
def read_env_var(var_name):
    """从 .env 文件读取环境变量"""
    try:
        env_path = Path('.env')
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip().startswith(f'{var_name}='):
                        return line.strip().split('=', 1)[1]
    except:
        pass
    return None

JWT_SECRET = read_env_var('JWT_SECRET')
API_KEY = read_env_var('OH_MY_GPT_KEY')

def generate_jwt_token():
    """生成 JWT token 用于认证"""
    if not JWT_SECRET:
        return None

    payload = {
        'sub': 'rag_ingest_script',  # Subject
        'iat': int(time.time()),      # Issued at
        'exp': int(time.time()) + 3600  # Expires in 1 hour
    }

    try:
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        # 确保返回字符串类型
        if isinstance(token, bytes):
            token = token.decode('utf-8')
        return token
    except Exception as e:
        print(f"生成 JWT token 失败: {e}")
        return None

# 支持的文件扩展名
SUPPORTED_EXTENSIONS = {
    '.txt', '.md', '.pdf', '.doc', '.docx', 
    '.csv', '.json', '.xml', '.html', '.htm',
    '.rtf', '.odt', '.rst'
}

def get_files_to_ingest(docs_dir):
    """
    遍历 docs 目录，获取所有支持的文件
    """
    docs_path = Path(docs_dir)
    if not docs_path.exists():
        raise FileNotFoundError(f"目录不存在: {docs_dir}")
    
    files_to_ingest = []
    for file_path in docs_path.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
            files_to_ingest.append(file_path)
    
    return files_to_ingest

def ingest_file(file_path):
    """
    将单个文件通过 API 导入到 RAG 系统
    """
    try:
        # 检测 MIME 类型
        mime_type, _ = mimetypes.guess_type(str(file_path))
        if mime_type is None:
            mime_type = 'application/octet-stream'
        
        # 准备文件上传
        with open(file_path, 'rb') as f:
            files = {
                'file': (file_path.name, f, mime_type)
            }
            
            # 准备表单数据
            data = {
                'collection_name': COLLECTION_NAME
            }
            
            # 准备请求头
            headers = {}
            token = generate_jwt_token()
            if token:
                headers['Authorization'] = f'Bearer {token}'
            
            # 发送请求
            print(f"正在导入: {file_path.name}...", end=' ')
            response = requests.post(RAG_API_URL, files=files, data=data, headers=headers, timeout=300)
            
            if response.status_code == 200:
                print("✓ 成功")
                return True
            else:
                print(f"✗ 失败 (状态码: {response.status_code})")
                print(f"  错误信息: {response.text}")
                return False
                
    except Exception as e:
        print(f"✗ 失败")
        print(f"  错误: {str(e)}")
        return False

def main():
    """
    主函数
    """
    print("="*60)
    print("公司文档导入工具 - RAG 知识库")
    print("="*60)
    print(f"目标集合: {COLLECTION_NAME}")
    print(f"文档目录: {DOCS_DIR}")
    print(f"API 地址: {RAG_API_URL}")
    print("="*60)
    
    # 获取所有待导入文件
    try:
        files = get_files_to_ingest(DOCS_DIR)
    except FileNotFoundError as e:
        print(f"\n错误: {e}")
        return
    
    if not files:
        print(f"\n在 {DOCS_DIR} 目录中未找到支持的文档文件。")
        print(f"支持的文件格式: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
        return
    
    print(f"\n找到 {len(files)} 个文件待导入:\n")
    for i, file_path in enumerate(files, 1):
        print(f"  {i}. {file_path.relative_to(DOCS_DIR)}")
    
    # 确认导入
    print(f"\n准备将以上文件导入到集合 '{COLLECTION_NAME}'")
    confirm = input("是否继续？(y/n): ").strip().lower()
    
    if confirm != 'y':
        print("操作已取消。")
        return
    
    # 执行导入
    print("\n开始导入文档...")
    print("-"*60)
    
    success_count = 0
    fail_count = 0
    
    for file_path in files:
        if ingest_file(file_path):
            success_count += 1
        else:
            fail_count += 1
    
    # 显示结果
    print("-"*60)
    print(f"\n导入完成！")
    print(f"  成功: {success_count} 个文件")
    print(f"  失败: {fail_count} 个文件")
    print(f"  总计: {len(files)} 个文件")
    print("="*60)

if __name__ == "__main__":
    main()
