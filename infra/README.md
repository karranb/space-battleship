### Backend

- Hosted on an EC2
- Uses PM2 and [nginx](./nginx.conf)

**How to deploy?**

- Connect to EC2

```bash
$ ssh -i ./space-battleship.pem ec2-user@ec2-44-207-7-52.compute-1.amazonaws.com
```

- Pull the updates

```bash
$ git pull
```

- Build the project

```bash
$ yarn build
```

- Create a .env.production file based on the .env.example in the dist/config folder

- Run the server using pm2

```bash
$ NODE_PATH=dist pm2 start node dist/index.js
```

### Frontend

- Hosted on AWS buckets
