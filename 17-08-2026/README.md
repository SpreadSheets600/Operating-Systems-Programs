# Process Creation Using fork() in CentOS 7

## Aim

To write and execute C programs that print output using the `fork()` system call, create child processes, and display the process IDs (PID) and parent process IDs (PPID) of both parent and child processes, observing their execution behavior.

## Requirements

- CentOS 7 environment
- Terminal access
- GCC compiler (`gcc`)
- Basic knowledge of C programming

## Program 1: Print "Hello World"

A simple C program that prints `Hello World` to the terminal:

```c
#include <stdio.h>

int main() {
    printf("Hello World\n");
    return 0;
}
```

Save the program in a file, for example `hello.c`, then compile and execute it:

```bash
gcc hello.c -o hello
./hello
```

Output:

```text
Hello World
```

Here:

- `#include <stdio.h>` provides the `printf` function.
- `gcc hello.c -o hello` compiles the source file into an executable named `hello`.
- `./hello` runs the compiled program.

## Program 2: Print "Hello World" with fork()

The `fork()` system call creates a new process by duplicating the calling process. The following program prints `Hello World` from both the parent and the child process:

```c
#include <stdio.h>
#include <unistd.h>

int main() {
    fork();
    printf("Hello World\n");
    return 0;
}
```

Compile and execute:

```bash
gcc hello_fork.c -o hello_fork
./hello_fork
```

Output:

```text
Hello World
Hello World
```

Here:

- `fork()` creates a child process that is an almost exact copy of the parent.
- After `fork()` returns, **both** processes continue executing from the next statement.
- Therefore, `printf` executes twice — once in the parent and once in the child — so the line is printed twice.

## Program 3: Display PID and PPID of Parent and Child

The `getpid()` function returns the process ID of the calling process, and `getppid()` returns the process ID of its parent. The `<sys/types.h>` header defines the `pid_t` data type used to store process IDs:

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

Compile and execute:

```bash
gcc pid_demo.c -o pid_demo
./pid_demo
```

Example output:

```text
Parent process: PID = 3421, PPID = 2890
Child process : PID = 3422, PPID = 3421
```

In this output:

- The child's PID (`3422`) is one greater than the parent's PID (`3421`), because the kernel assigns the next available process ID when `fork()` creates the child.
- The child's PPID equals the parent's PID, since the parent is the process that created it.
- The exact numbers differ on every run because PIDs are assigned dynamically by the operating system.

The return value of `fork()` decides which branch runs:

| Return value | Meaning | Running context |
| --- | --- | --- |
| Negative | `fork()` failed, no child created | Parent |
| `0` | Executing inside the newly created child | Child |
| Positive | Executing inside the parent; value is the child's PID | Parent |

## Program 4: Observe Parent and Child Behavior with sleep()

Adding `sleep()` in the child process delays it, making the order of execution between parent and child observable:

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

Compile and execute:

```bash
gcc sleep_demo.c -o sleep_demo
./sleep_demo
```

Example output:

```text
Parent process: PID = 3510, PPID = 2890
Child process : PID = 3511, PPID = 1
```

Observations:

- Without `sleep()`, both processes run concurrently and the print order may vary between runs.
- With `sleep(2)` in the child, the parent finishes first and its line appears immediately; the child's line appears after the 2-second delay.
- In some runs the child's PPID shows as `1`: when the parent terminates before the child, the child becomes an **orphan** and is adopted by the `init` process (PID `1`). This is why `sleep()` is useful — increasing the delay makes the orphan behavior clearly visible.

## Result

C programs using `fork()` were written, compiled, and executed successfully. The creation of child processes was observed, the PID and PPID of parent and child processes were displayed, and the effect of `sleep()` on the order of execution and the orphan-child behavior was studied.
