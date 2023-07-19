# TarnishedBlogs

## Setup

This README will provide steps of a user on a Windows machine. This project will utilize PostgreSQL, a free and open-source relational database management system.

To get started, open your repository in Visual Studio Code, or any other code editing software you'd like, but be warned, this project was created and maintained primarily through VSCODE, so it will be easier to follow along if you also use VSCODE.

Run the following in the terminal, and make sure you are located in the `backend` directory as we will only be creating the backend, for now:
```
npm i
```
Or
```
npm install
```

The command you just ran scanned your package.json file and installed all of the needed dependencies and development dependencies inside of a `node_modules` folder. You will also need to create a `.env` file and `.gitignore` file inside the root of your directory, the same directory as your package.json file.

You `.env` file will remain empty for now. Inside of your `.gitignore` file, copy and paste the following:

```
.env
node_modules
```

Doing this will ensure that the speficied files you entered into this `.gitignore` file will not be tracked because the information the will be stored in your `.env` are sensitive information that you do not want to share to others, especially the internet. We gitignored the `node_modules` folder because they size is too big and can simply be gotten through the `npm install` command.

### PostgreSQL

Now we will get into implenting Postgres and the rest of the backend into the project. You can begin by installing [Postgres](https://www.postgresql.org/download/) on your computer. During the installation process, you will be prompted to created a password, which will be associated with the `postgres` superuser. Remember this password or write it down somewhere as it is very important.

After successfully downloading Postgres, you should be able to search up and find a new PostgreSQL Shell called `psql`. If you are on windows and want to run `psql` on command prompt, you will have to add new paths into your environment variables. You can find out how to do this online, for now, you can simply follow through the psql shell.

If the first thing you see upon opening up the shell is:

```
Server [localhost]:
```

Press enter 4 times, upon which you should see:

```
Server [localhost]:
Database [postgres]:
Port [5432]:
Username [postgres]:
Password for user postgres:
```

Enter the password you created in the beginning. You should then see something like this:

```
psql (15.3)
WARNING: Console code page (437) differs from Windows code page (1252)
         8-bit characters might not work correctly. See psql reference
         page "Notes for Windows users" for details.
Type "help" for help.

postgres=#
```

Now, create a new user. (Replace `<database user name>` and `<password>` with your desired username and password. DO NOT include the angle brackets in ANY commands):

```
CREATE ROLE <database user name> WITH LOGIN PASSWORD '<password>';
```

Grant priveleges to your user:

```
ALTER ROLE <database user name> CREATEDB;
```

Check if your new user exists:

```
\du
```

### Creating the Database

Create a new database:

```
CREATE DATABASE tarnished_blogs;
```

Change the owner of the database:

```
ALTER DATABASE tarnished_blogs OWNER TO <database user name>;
```

Run `\l` to check that the `tarnished_blogs` database has been created and the owner belongs to the provided user name.

Close psql by typing `\q`.

### Setting Up the Environment Variables

In your `.env` file, add the following:

```
DB_USER=<your-user-name>
DB_HOST=localhost
DB_NAME=tarnished_blogs
DB_PASSWORD=<your-database-password>
DB_PORT=5432
SESSION_SECRET=...
```

Replace all of the required values. As for the `SESSION_SECRET`, in the terminal type in `node` and press `enter`. Then, enter the following command:

```
require("crypto").randomBytes(64).toString("hex")
```

Enter this value, excluding the single quotes, as the `SESSION_SECRET` value.

### Sequelize

Now that your database is up, you will now implement `Sequelize` into your project. All of the required sequelize dependencies should have already been installed, so simply run:

```
npx sequelize-cli db:migrate
```

Then:

```
npx sequelize-cli db:seed:all
```

If you have the PostgreSQL extension by Chris Kolkman, you can go into the extension from the sidebar and add your database. Enter the required fields and make sure to choose "Standard Connection" when prompted.

Click on the database, `tarnished_blogs` -> `public`, then you should see a `Functions` dropdown, and four tables, `SequelizeMeta`, `comments`, `posts`, and `users`, respectively. Right-click on either of the four tables, click `Select` then `Run Select Top 1000`. You should see data provided by the seed file.

## Testing

### Postman

For testing, you can use Postman as it is also what I used for testing the functionality of my program. First, download Postman then start the server through:

```
npm start
```

Then, use [this](https://restless-station-14503.postman.co/workspace/New-Team-Workspace~39dc5111-75dc-40f7-b5dd-cffa20c10f0c/collection/28425494-ed61216b-c335-4a75-a07c-acce886cf614?action=share&creator=28425494) Postman collection to test out the database.

My testing showed all CRUD operations to work as expected.

## Miscellaneous

### Models

#### Users

- Name (string)
- Email (string)
- Password (string)

Sequelize Command:

```
npx sequelize-cli model:generate --name User --attributes name:string,email:string,password:string
```

#### Posts

- Title (string)
- Content (string)

Sequelize Command:

```
npx sequelize-cli model:generate --name Posts --attributes title:string,content:string
```
