import amqp from 'amqplib';

import socketServer from './socket';
import mail from './utils/email';

class RabbitConnection {
  constructor() {
    RabbitConnection.createConnection();
    this.connection = null;
    this.channel = null;
  }

  static getInstance() {
    if (!RabbitConnection.instance) {
      RabbitConnection.instance = new RabbitConnection();
    }
    return RabbitConnection.instance;
  }

  // create connection to rabbitmq

  static async createConnection() {
    try {
      this.connection = await amqp.connect('amqp://guest:guest@localhost:5672');
      console.log('notification rabbitmq connection establish');
      this.channel = await this.connection.createChannel();
      this.channel.assertQueue(process.env.NOTIFICATION_QUEUE);
      this.channel.assertQueue(process.env.EMAIL_QUEUE);

      // consumer functions

      this.channel
        .consume(process.env.EMAIL_QUEUE, async (data) => {
          const recievedData = JSON.parse(data.content);
          console.log(recievedData);
          const mailData = {
            email: recievedData.email,
            id: recievedData.id,
          };
          const ok = await mail(mailData.email, mailData);
          console.log('this is ok', ok);
          this.channel.ack(data);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  }
}

export default RabbitConnection;
