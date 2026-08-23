# Process Creation Using fork() in CentOS 7

## Program 1: Print "Hello World"

### Aim

To write a C program that prints `Hello World` on the terminal.

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
    return 0;
}
```

Output:

```text
Hello World
```

## Program 2: Print "Hello World" with fork()

### Aim

To write a C program that prints `Hello World` using `fork()` so that both the parent and the child process print the line.

```c
#include <stdio.h>
#include <unistd.h>

int main() {
    fork();
    printf("Hello World\n");
    return 0;
}
```

Output:

```text
Hello World
Hello World
```

## Program 3: Display PID and PPID of Parent and Child

### Aim

To write a C program using `fork()` and `<sys/types.h>` that creates a child process and displays the PID and PPID of both the parent and the child processes.

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    pid_t pid;

    pid = fork();

    if (pid < 0) {
        printf("Fork failed\n");
        return 1;
    } else if (pid == 0) {
        printf("Child process : PID = %d, PPID = %d\n", getpid(), getppid());
    } else {
        printf("Parent process: PID = %d, PPID = %d\n", getpid(), getppid());
    }

    return 0;
}
```

Output:

```text
Parent process: PID = 3421, PPID = 2890
Child process : PID = 3422, PPID = 3421
```

## Program 4: Parent and Child Behavior with sleep()

### Aim

To write a C program using `fork()` and `<sys/types.h>` that adds `sleep()` in the child process and observe the parent and child process behavior during execution.

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    pid_t pid;

    pid = fork();

    if (pid < 0) {
        printf("Fork failed\n");
        return 1;
    } else if (pid == 0) {
        sleep(2);
        printf("Child process : PID = %d, PPID = %d\n", getpid(), getppid());
    } else {
        printf("Parent process: PID = %d, PPID = %d\n", getpid(), getppid());
    }

    return 0;
}
```

Output:

```text
Parent process: PID = 3510, PPID = 2890
Child process : PID = 3511, PPID = 1
```

## Result

C programs using `fork()` were written and executed successfully. The PID and PPID of parent and child processes were displayed, and the effect of `sleep()` on parent–child behavior was observed.
