FROM python:3.6
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
ENV GRP_NAME "SET YOUR SPEKER GROUP NAME"
ENTRYPOINT ["python"]
CMD ["main.py"]
