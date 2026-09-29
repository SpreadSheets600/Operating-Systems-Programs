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