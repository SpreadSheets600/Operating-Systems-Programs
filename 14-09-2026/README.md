# Zombie Process, Orphan Process and Threads

## Program 1: Zombie Process

To write a C program that demonstrates the creation of a zombie process using `fork()`, where the child terminates before the parent collects its exit status.

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>

int main()
{
    pid_t pid;

    pid = fork();

    if (pid < 0)
    {
        printf("Fork Failed!\n");
        return 1;
    }
    else if (pid == 0)
    {
        printf("Child Process\n");
        printf("Child PID: %d\n", getpid());
        printf("Parent PID: %d\n", getppid());

        exit(0);
    }
    else
    {
        printf("Parent Process\n");
        printf("Parent PID: %d\n", getpid());
        printf("Child PID: %d\n", pid);

        sleep(30);
    }

    return 0;
}
```

### Output

```text
Parent Process
Parent PID: 4172
Child PID: 4173
Child Process
Child PID: 4173
Parent PID: 4172
```

## Program 2: Orphan Process

To write a C program that demonstrates the creation of an orphan process using `fork()`, where the parent terminates before the child completes.

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>

int main()
{
    pid_t pid;

    pid = fork();

    if (pid < 0)
    {
        printf("Fork Failed!\n");
        return 1;
    }
    else if (pid == 0)
    {
        sleep(5);

        printf("\nChild Process\n");
        printf("Child PID: %d\n", getpid());
        printf("New Parent PID: %d\n", getppid());

        sleep(20);
    }
    else
    {
        printf("Parent Process\n");
        printf("Parent PID: %d\n", getpid());
        printf("Child PID: %d\n", pid);

        printf("Parent Is Terminating ...\n");
        exit(0);
    }

    return 0;
}
```

### Output

```text
Parent Process
Parent PID: 3998
Child PID: 3999
Parent Is Terminating ...

Child Process
Child PID: 3999
New Parent PID: 190
```

## Program 3: Threads

To write a C program that implements multithreading using POSIX threads (`pthread`), where one thread prints numbers from 1 to 10 and the main thread prints numbers from 20 to 30.

```c
#include <stdio.h>
#include <pthread.h>

void *fun1(void *arg)
{
    int i;

    for (i = 1; i <= 10; i++)
    {
        printf("%d ", i);
    }

    printf("\n");

    return NULL;
}

int main()
{
    pthread_t tid;
    int j;

    pthread_create(&tid, NULL, fun1, NULL);

    pthread_join(tid, NULL);

    for (j = 20; j <= 30; j++)
    {
        printf("%d ", j);
    }

    printf("\n");

    return 0;
}
```

### Output

```text
1 2 3 4 5 6 7 8 9 10 
20 21 22 23 24 25 26 27 28 29 30 
```
