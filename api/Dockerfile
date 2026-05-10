FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

WORKDIR /home/user/app

COPY requirements.txt api/
RUN pip install --no-cache-dir -r api/requirements.txt

COPY . api/

ENV PYTHONPATH=/home/user/app

EXPOSE 7860

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
