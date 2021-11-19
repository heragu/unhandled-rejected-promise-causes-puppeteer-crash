FROM amazon/aws-lambda-nodejs:latest

# Copy function code
COPY package.json ${LAMBDA_TASK_ROOT}
RUN npm install
COPY app.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "app.handler" ]