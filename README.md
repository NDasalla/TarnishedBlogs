# TarnishedBlogs

Follow README's from Day 19 - Day 22 for setup

## Tables

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

#### Comments
