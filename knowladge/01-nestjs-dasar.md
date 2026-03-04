# NestJS Dasar — Knowledge Reference

> **Sumber**: Presentasi "NestJS Dasar" oleh Eko Kurniawan Khannedy (ProgrammerZamanNow)
> **Tujuan**: Referensi actionable untuk implementasi NestJS

---

## Table of Contents

1. [Pengenalan NestJS](#1-pengenalan-nestjs)
2. [NestJS CLI & Setup Project](#2-nestjs-cli--setup-project)
3. [Struktur Folder](#3-struktur-folder)
4. [Decorator](#4-decorator)
5. [Module](#5-module)
6. [Controller](#6-controller)
7. [HTTP Method & Routing](#7-http-method--routing)
8. [HTTP Request & Response](#8-http-request--response)
9. [Asynchronous](#9-asynchronous)
10. [Cookie](#10-cookie)
11. [View / Template Engine](#11-view--template-engine)
12. [Unit Test & Integration Test](#12-unit-test--integration-test)
13. [Provider & Dependency Injection](#13-provider--dependency-injection)
14. [Custom Provider](#14-custom-provider)
15. [Module Reference](#15-module-reference)
16. [Configuration](#16-configuration)
17. [Shared Module & Global Module](#17-shared-module--global-module)
18. [Database (Prisma)](#18-database-prisma)
19. [Logging (Winston)](#19-logging-winston)
20. [Dynamic Module](#20-dynamic-module)
21. [Validation (Zod)](#21-validation-zod)
22. [Middleware](#22-middleware)
23. [Exception Filter](#23-exception-filter)
24. [Pipe](#24-pipe)
25. [Interceptor](#25-interceptor)
26. [Custom Decorator](#26-custom-decorator)
27. [Guard](#27-guard)
28. [Lifecycle Event](#28-lifecycle-event)
29. [Reflector](#29-reflector)
30. [Global Provider](#30-global-provider)

---

## 1. Pengenalan NestJS

- Framework server-side berbasis **NodeJS** yang efisien dan scalable
- Menggunakan **TypeScript** sebagai bahasa utama (juga support JavaScript)
- Internal NestJS menggunakan library populer:
  - **ExpressJS** → HTTP Handler
  - **Jest** → Unit Test
  - **Prisma** → Database ORM
  - **Winston** → Logging
- Website: https://nestjs.com/

### Keuntungan Menggunakan Framework

- Semua orang menggunakan **cara yang sama** → konsistensi tim
- Orang baru mudah beradaptasi karena kerangka kerja yang **sudah umum**
- Mengurangi perdebatan tentang cara kerja

---

## 2. NestJS CLI & Setup Project

### Install CLI

```bash
npm install -g @nestjs/cli
```

### Membuat Project Baru

```bash
nest new nama-project
```

### Menjalankan Aplikasi

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Unit test
npm run test

# Integration test (e2e)
npm run test:e2e
```

> **Tip**: Semua script tersedia di `package.json` → bagian `scripts`

---

## 3. Struktur Folder

```
project-root/
├── src/           # Kode program aplikasi & unit test
│   ├── app.module.ts       # Root/Application Module
│   ├── app.controller.ts   # Root Controller
│   ├── app.service.ts      # Root Service
│   └── main.ts             # Entry point
├── test/          # Integration test (e2e)
│   └── app.e2e-spec.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 4. Decorator

- Fitur utama yang membedakan NestJS dari ExpressJS manual
- Menambahkan **metadata** (informasi tambahan) pada kode
- Sintaks: `@NamaDecorator()`
- Bisa digunakan di: Class, Function, Parameter, Constructor, Property

```typescript
@Controller('/api/users')     // Class decorator
export class UserController {

  @Get()                       // Method decorator
  findAll(@Query('name') name: string) {  // Parameter decorator
    // ...
  }
}
```

---

## 5. Module

### Konsep

- Module = class dengan decorator `@Module()`
- Aplikasi dibagi menjadi bagian **modular**
- Setiap app memiliki **Application Module** (root module) yang import module lain

### Diagram

```
AppModule
├── UserModule
├── ProductModule
└── CommonModule
```

### Membuat Module

```bash
# generate otomatis (auto-register ke parent module)
nest generate module user
```

### Kode Module

```typescript
// user.module.ts
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [],       // import module lain
  exports: [],       // expose provider ke module lain
})
export class UserModule {}
```

### Atribut @Module()

| Atribut       | Fungsi                                            |
|---------------|---------------------------------------------------|
| `controllers` | Daftar controller yang dimiliki module             |
| `providers`   | Daftar provider (service, repo, dll)               |
| `imports`     | Module lain yang di-import                         |
| `exports`     | Provider yang di-sharing ke module lain             |

---

## 6. Controller

### Konsep

- Class dengan decorator `@Controller(prefix)`
- Memproses **HTTP Request** dan mengembalikan **HTTP Response**
- Harus diregistrasikan pada Module

### Membuat Controller

```bash
nest generate controller user
```

### Kode Controller

```typescript
@Controller('/api/users')
export class UserController {

  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(): string {
    return 'Get All Users';
  }

  @Get(':id')
  findOne(@Param('id') id: string): string {
    return `Get User ${id}`;
  }
}
```

---

## 7. HTTP Method & Routing

### Decorator HTTP Method

| Decorator        | HTTP Method   |
|------------------|---------------|
| `@Get(path)`     | GET           |
| `@Post(path)`    | POST          |
| `@Put(path)`     | PUT           |
| `@Delete(path)`  | DELETE        |
| `@Patch(path)`   | PATCH         |
| `@Head(path)`    | HEAD          |
| `@Options(path)` | OPTIONS       |
| `@All(path)`     | Semua method  |

### Contoh

```typescript
@Controller('/api/users')
export class UserController {

  @Get()
  findAll() { /* GET /api/users */ }

  @Post()
  create() { /* POST /api/users */ }

  @Put(':id')
  update(@Param('id') id: string) { /* PUT /api/users/:id */ }

  @Delete(':id')
  remove(@Param('id') id: string) { /* DELETE /api/users/:id */ }
}
```

---

## 8. HTTP Request & Response

### Request Decorator

| Decorator          | Ekuivalen Express       | Keterangan                    |
|--------------------|-------------------------|-------------------------------|
| `@Req()`           | `req`                   | Full request object           |
| `@Param(key?)`     | `req.params[key]`       | Route parameter               |
| `@Body(key?)`      | `req.body[key]`         | Request body                  |
| `@Query(key?)`     | `req.query[key]`        | Query string parameter        |
| `@Header(key?)`    | `req.headers[key]`      | Request header                |
| `@Ip()`            | `req.ip`                | Client IP address             |
| `@HostParam()`     | `req.hosts`             | Host parameters               |

> **Rekomendasi**: Gunakan decorator spesifik (`@Param`, `@Body`, dll) daripada `@Req()` agar lebih clean dan testable.

### Response Decorator

| Decorator                      | Fungsi                                          |
|--------------------------------|-------------------------------------------------|
| `@HttpCode(code)`              | Ubah response status code                       |
| `@Header(key, value)`          | Set response header                              |
| `@Redirect(url, code)`         | Redirect ke URL lain                              |
| `@Res()`                       | Akses express.Response (tidak direkomendasikan)  |

> **Rekomendasi**: Langsung gunakan **return value** untuk response body, bukan `@Res()`.

### Contoh Penggunaan

```typescript
@Post()
@HttpCode(201)
@Header('X-Custom', 'value')
create(@Body() createDto: CreateUserDto): User {
  return this.userService.create(createDto);
}

@Get(':id')
findOne(
  @Param('id') id: string,
  @Query('include') include?: string,
  @Header('authorization') auth?: string,
): User {
  return this.userService.findOne(id);
}
```

---

## 9. Asynchronous

- Controller method bisa **async** dan return `Promise<T>`

```typescript
@Get()
async findAll(): Promise<User[]> {
  return await this.userService.findAll();
}
```

---

## 10. Cookie

### Setup

```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

### Registrasi di `main.ts`

```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  await app.listen(3000);
}
```

### Penggunaan

```typescript
@Get()
getCookie(@Req() req: Request): string {
  return req.cookies['token'];
}

@Post()
setCookie(@Res({ passthrough: true }) res: Response): string {
  res.cookie('token', 'secret-value', { httpOnly: true });
  return 'Cookie set';
}
```

---

## 11. View / Template Engine

NestJS tidak punya template engine sendiri, tapi bisa menggunakan template engine Express seperti **Mustache**.

```bash
npm install mustache-express
npm install --save-dev @types/mustache-express
```

```typescript
// main.ts
import * as mustache from 'mustache-express';

app.setViewEngine('html');
app.engine('html', mustache());
app.setBaseViewsDir(join(__dirname, '..', 'views'));
```

```typescript
// controller
@Get('hello')
@Render('hello')  // render views/hello.html
getHello() {
  return { name: 'World' };
}
```

---

## 12. Unit Test & Integration Test

### Unit Test

- File: `*.spec.ts` (di folder `src/`)
- Framework: **Jest**
- Auto-generate saat membuat controller/service via CLI

```typescript
describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should return all users', () => {
    expect(controller.findAll()).toBeDefined();
  });
});
```

### Integration Test (E2E)

- File: `*.e2e-spec.ts` (di folder `test/`)
- Framework: **Jest + Supertest**
- Konfigurasi: `test/jest-e2e.json`

```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(200);
  });
});
```

### Mock Object

- Gunakan `node-mocks-http` untuk mock `express.Request` / `express.Response`

```bash
npm install --save-dev node-mocks-http
```

---

## 13. Provider & Dependency Injection

### Provider

- Class dengan decorator `@Injectable()`
- Bisa berupa: Service, Repository, Factory, Helper, dll
- Harus diregistrasikan pada Module (atribut `providers`)

```bash
nest generate provider user
# atau khusus service:
nest generate service user
```

```typescript
@Injectable()
export class UserService {
  findAll(): string[] {
    return ['user1', 'user2'];
  }
}
```

### Dependency Injection (DI)

- NestJS melakukan DI secara **otomatis** via **constructor parameter**
- Semua Module, Controller, Provider = **singleton object**

```typescript
@Controller('/api/users')
export class UserController {
  // DI via constructor
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
```

### Property-based Injection (alternatif)

```typescript
@Controller('/api/users')
export class UserController {
  @Inject()
  private readonly userService: UserService;
}
```

### Optional Dependency

```typescript
@Injectable()
export class UserService {
  constructor(
    @Optional() @Inject('LOGGER') private readonly logger?: LoggerService,
  ) {}
}
```

---

## 14. Custom Provider

### 4 Jenis Custom Provider

#### 1. Standard Provider (default)

```typescript
@Module({
  providers: [UserService], // shorthand
})
```

#### 2. Class Provider

```typescript
@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useClass: process.env.DB === 'mysql'
        ? MySQLConnection
        : MongoDBConnection,
    },
  ],
})
```

#### 3. Value Provider

```typescript
const configValue = { host: 'localhost', port: 3306 };

@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: configValue,
    },
  ],
})
```

#### 4. Factory Provider

```typescript
@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useFactory: (configService: ConfigService) => {
        return new DatabaseConnection(configService.get('DB_HOST'));
      },
      inject: [ConfigService],  // dependency untuk factory
    },
  ],
})
```

#### 5. Alias Provider

```typescript
@Module({
  providers: [
    UserService,
    {
      provide: 'AliasUserService',
      useExisting: UserService,  // alias ke provider yang sama
    },
  ],
})
```

### Menggunakan Custom Provider

```typescript
@Injectable()
export class UserController {
  constructor(
    @Inject('CONNECTION') private readonly connection: Connection,
    @Inject('CONFIG') private readonly config: any,
  ) {}
}
```

---

## 15. Module Reference

- Class `ModuleRef` untuk mengambil provider **secara manual** (lazy)
- Bisa digunakan ketika tidak ingin DI otomatis

```typescript
@Injectable()
export class UserService {
  constructor(private readonly moduleRef: ModuleRef) {}

  someMethod() {
    const service = this.moduleRef.get(AnotherService);
    // gunakan service...
  }
}
```

---

## 16. Configuration

### Setup

```bash
npm install @nestjs/config
```

### Registrasi

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),  // baca .env secara otomatis
  ],
})
export class AppModule {}
```

### Penggunaan

```typescript
@Injectable()
export class DatabaseService {
  constructor(private readonly configService: ConfigService) {}

  getDbHost(): string {
    return this.configService.get<string>('DATABASE_HOST');
  }
}
```

### File `.env`

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=secret
```

### Menggunakan di NestJS Application (main.ts)

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
```

---

## 17. Shared Module & Global Module

### Shared Module

- Module bersifat **singleton** → aman di-import banyak module
- Secara default, Provider **tidak** di-sharing keluar Module
- Gunakan `exports` untuk sharing Provider

```typescript
@Module({
  providers: [UserService],
  exports: [UserService],  // sharing ke module lain
})
export class UserModule {}
```

```typescript
@Module({
  imports: [UserModule],  // bisa pakai UserService
})
export class OrderModule {}
```

### Global Module

- Module yang **otomatis ter-import** di semua Module
- Gunakan decorator `@Global()`

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> **Tip**: Cocok untuk module yang dipakai hampir di semua tempat, misal: Prisma, Logger, Config

---

## 18. Database (Prisma)

### Setup

```bash
npm install --save-dev prisma
npx prisma init
```

### Prisma Service

```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Prisma Module

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({ data });
  }
}
```

### ORM Alternatif

NestJS juga support: MikroORM, TypeORM, Sequelize, Mongoose

---

## 19. Logging (Winston)

### Setup

```bash
npm install nest-winston winston
```

### Registrasi di `main.ts`

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });
  await app.listen(3000);
}
```

### Penggunaan di Service/Controller

```typescript
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class UserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  findAll() {
    this.logger.info('Finding all users');
    // ...
  }
}
```

---

## 20. Dynamic Module

- Module yang dibuat secara **dinamis** menggunakan method (bukan static decorator)
- Provider/Controller ditentukan secara **runtime** berdasarkan parameter

```typescript
@Module({})
export class ValidationModule {
  static forRoot(options: ValidationOptions): DynamicModule {
    return {
      module: ValidationModule,
      providers: [
        {
          provide: 'VALIDATION_OPTIONS',
          useValue: options,
        },
        ValidationService,
      ],
      exports: [ValidationService],
    };
  }
}
```

```typescript
// Penggunaan
@Module({
  imports: [
    ValidationModule.forRoot({ strict: true }),
  ],
})
export class AppModule {}
```

### Contoh di Library NestJS

- `ConfigModule.forRoot()`
- `WinstonModule.forRoot()`

---

## 21. Validation (Zod)

### Setup

```bash
npm install zod
```

### Validation Service

```typescript
import { Injectable } from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class ValidationService {
  validate<T>(schema: ZodType<T>, data: T): T {
    return schema.parse(data);
  }
}
```

### Penggunaan

```typescript
import { z } from 'zod';

// Schema definition
const CreateUserSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;

// Di Service
@Injectable()
export class UserService {
  constructor(private readonly validationService: ValidationService) {}

  create(request: CreateUserRequest) {
    const validated = this.validationService.validate(
      CreateUserSchema,
      request
    );
    // lanjutkan dengan data yang sudah tervalidasi
  }
}
```

### Alternatif: class-validator

```bash
npm install class-validator class-transformer
```

---

## 22. Middleware

### Konsep

- Sama seperti Middleware di ExpressJS
- Mendukung **Dependency Injection**
- Dieksekusi **sebelum** Route Handler

```
Client → Middleware → Controller → Response
```

### Membuat Middleware

```bash
nest generate middleware log
```

```typescript
@Injectable()
export class LogMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.info(`${req.method} ${req.url}`);
    next();
  }
}
```

### Registrasi Middleware

```typescript
@Module({
  // ...
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogMiddleware)
      .forRoutes('*');  // wildcard: semua route

    // atau spesifik controller
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }
}
```

---

## 23. Exception Filter

### Konsep

- Menangkap **Error yang tidak tertangani** dan mengubahnya jadi response user-friendly
- NestJS sudah punya **Global Exception Filter** (default → JSON response)

### HttpException

```typescript
// Throw HttpException langsung
throw new HttpException('User not found', HttpStatus.NOT_FOUND);

// Atau gunakan built-in exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Not authenticated');
throw new ForbiddenException('Access denied');
```

### Membuat Custom Exception Filter

```typescript
@Catch(ZodError)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(400).json({
      code: 400,
      errors: exception.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
}
```

### Menggunakan Filter

```typescript
// Di method
@Post()
@UseFilters(ValidationFilter)
create(@Body() dto: CreateUserDto) { /* ... */ }

// Di controller (semua method)
@Controller('/api/users')
@UseFilters(ValidationFilter)
export class UserController { /* ... */ }

// Global
app.useGlobalFilters(new ValidationFilter());
```

---

## 24. Pipe

### Konsep

- **Transformasi** tipe data parameter sebelum dikirim ke Controller Method
- Digunakan di decorator `@Query`, `@Body`, `@Param`

### Built-in Pipe

| Pipe              | Fungsi                              |
|-------------------|-------------------------------------|
| `ParseIntPipe`    | Parse string → integer              |
| `ParseFloatPipe`  | Parse string → float                |
| `ParseBoolPipe`   | Parse string → boolean              |
| `ParseArrayPipe`  | Parse string → array                |
| `ParseUUIDPipe`   | Validasi & parse UUID               |
| `ParseEnumPipe`   | Validasi & parse enum               |
| `DefaultValuePipe`| Set default value jika undefined    |

### Penggunaan

```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.userService.findOne(id);
}

@Get()
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  return this.userService.findAll(page, limit);
}
```

### Membuat Custom Pipe

```bash
nest generate pipe validation
```

```typescript
@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: any, metadata: ArgumentMetadata) {
    return this.schema.parse(value);
  }
}
```

### Global Pipe

```typescript
// Di controller
@Controller('/api/users')
@UsePipes(new ValidationPipe(UserSchema))
export class UserController { /* ... */ }

// Global
app.useGlobalPipes(new ValidationPipe());
```

---

## 25. Interceptor

### Konsep

- Mirip Middleware, tapi bisa **mengubah Response**
- Middleware: hanya mengolah Request → next
- Interceptor: bisa menerima Response dari Controller → ubah → kirim ke Client

```
Client → Middleware → Controller → Interceptor → Response
```

### Membuat Interceptor

```bash
nest generate interceptor time
```

```typescript
@Injectable()
export class TimeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    return next.handle().pipe(
      map(data => {
        return {
          data,
          timestamp: new Date().toISOString(),
          duration: `${Date.now() - start}ms`,
        };
      }),
    );
  }
}
```

> **Note**: NestJS Interceptor menggunakan **RxJS** (Reactive Extensions)

### Penggunaan

```typescript
// Di method
@Get()
@UseInterceptors(TimeInterceptor)
findAll() { /* ... */ }

// Di controller
@Controller('/api/users')
@UseInterceptors(TimeInterceptor)
export class UserController { /* ... */ }

// Global
app.useGlobalInterceptors(new TimeInterceptor());
```

---

## 26. Custom Decorator

### Konsep

- Membuat decorator sendiri untuk mengambil data dari request
- Menghindari penggunaan `express.Request` langsung

### Membuat Custom Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Auth = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // data yang di-set oleh AuthMiddleware
  },
);
```

### Penggunaan

```typescript
@Get('current')
getCurrentUser(@Auth() user: User): User {
  return user;
}
```

---

## 27. Guard

### Konsep

- Untuk **Authorization** (cek apakah user berhak akses)
- Middleware → Authentication (siapa usernya?)
- Guard → Authorization (apakah user boleh?)
- Guard tahu **Route mana** yang diakses (beda dengan Middleware)

### Membuat Guard

```bash
nest generate guard role
```

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return roles.includes(user.role);
  }
}
```

### Penggunaan

```typescript
@Get('admin')
@UseGuards(RoleGuard)
@Roles('admin')  // custom decorator (lihat Reflector)
getAdminData() {
  return 'Admin only data';
}

// Global
app.useGlobalGuards(new RoleGuard());
```

---

## 28. Lifecycle Event

### Daftar Lifecycle

| Lifecycle                    | Keterangan                                              |
|-----------------------------|---------------------------------------------------------|
| `OnModuleInit`              | Setelah semua module sudah di load                      |
| `OnApplicationBootstrap`    | Setelah semua module di-init, sebelum menerima koneksi  |
| `OnModuleDestroy`           | Setelah menerima sinyal penghentian                     |
| `BeforeApplicationShutdown` | Setelah OnModuleDestroy, koneksi akan ditutup            |
| `OnApplicationShutdown`     | Setelah semua koneksi ditutup                           |

### Implementasi

```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  async onModuleInit() {
    await this.$connect();
    console.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }
}
```

### Shutdown Hook

```typescript
// main.ts — aktifkan agar lifecycle shutdown berjalan saat Ctrl+C
app.enableShutdownHooks();
```

---

## 29. Reflector

### Konsep

- Mempermudah **membuat** dan **mengakses** Decorator
- Membantu Guard menjadi **singleton** (hemat memory)
- Menghindari `new Guard()` di setiap handler

### Roles Decorator dengan SetMetadata

```typescript
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### Guard yang Menggunakan Reflector

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return roles.includes(user.role);
  }
}
```

### Penggunaan

```typescript
@Get('admin')
@Roles('admin', 'superadmin')
@UseGuards(RoleGuard)
getAdminData() { /* ... */ }
```

---

## 30. Global Provider

### Masalah

- `app.useGlobalFilters/Pipes/Guards/Interceptors()` → tidak bisa memanfaatkan DI
- Karena object dibuat manual, bukan oleh NestJS container

### Solusi: Provider Alias

NestJS menyediakan **alias name** untuk mendaftarkan Global Provider melalui Module:

```typescript
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    // Global Exception Filter dengan DI support
    {
      provide: APP_FILTER,
      useClass: ValidationFilter,
    },
    // Global Guard dengan DI support
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    // Global Interceptor dengan DI support
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeInterceptor,
    },
    // Global Pipe dengan DI support
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

> **Keuntungan**: Provider ini bisa **di-inject** dependency lain (Reflector, Logger, dll)

---

## Quick Reference: Request Processing Pipeline

```
Client Request
  │
  ▼
Middleware (LogMiddleware, AuthMiddleware)
  │
  ▼
Guard (RoleGuard) → 403 if not authorized
  │
  ▼
Interceptor (before) → pre-processing
  │
  ▼
Pipe (ParseIntPipe, ValidationPipe) → transform/validate params
  │
  ▼
Controller Method → business logic
  │
  ▼
Interceptor (after) → post-processing / transform response
  │
  ▼
Exception Filter → catch errors → user-friendly response
  │
  ▼
Client Response
```

---

## CLI Commands Cheat Sheet

```bash
# Project
nest new project-name

# Generate resources
nest generate module name
nest generate controller name
nest generate service name
nest generate provider name
nest generate middleware name
nest generate guard name
nest generate interceptor name
nest generate pipe name

# Run
npm run start:dev         # development (watch mode)
npm run start:prod        # production
npm run test              # unit test
npm run test:e2e          # integration test
npm run build             # compile
```
