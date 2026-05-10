FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

COPY api/requirements.txt /home/user/app/
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ /home/user/app/api/

EXPOSE 7860

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
