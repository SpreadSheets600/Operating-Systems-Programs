# Orphan Process, Zombie Process and Threads in Linux

## Aim

To study process creation using `fork()`, demonstrate orphan and zombie processes, and implement multithreading using POSIX threads (`pthread`).

## Requirements

- CentOS 7 environment
- Terminal access with `gcc` compiler
- Basic knowledge of C programming

## Process Creation Using `fork()`

The `fork()` system call creates a new child process from the parent process:

```c
pid_t pid = fork();
```

Return values of `fork()`:

- `< 0` — fork failed, no child process is created.
- `== 0` — executed in the child process.
- `> 0` — executed in the parent process, returns the PID of the child.

Useful system calls used with `fork()`:

- `getpid()` — returns the PID of the current process.
- `getppid()` — returns the PID of the parent process.
- `exit(0)` — terminates the calling process.
- `sleep(n)` — suspends execution for `n` seconds.

Compile a process program:

```bash
gcc ZombieProcess.c -o zombie
gcc OrphanProcess.c -o orphan
```

## Zombie Process

A zombie process is a child process that has terminated, but its parent has not yet read its exit status using `wait()`.

The child entry remains in the process table until the parent collects it. A zombie can be observed with `ps` while the parent is sleeping.

Program file: `ZombieProcess.c`

In the program:

1. `fork()` creates a child process.
2. The child prints its PID and parent PID using `getpid()` and `getppid()`, then terminates immediately with `exit(0)`.
3. The parent prints its own PID and the child PID, then executes `sleep(30)` without calling `wait()`.
4. During these 30 seconds the terminated child exists as a zombie.

Compile and run:

```bash
gcc ZombieProcess.c -o zombie
./zombie
```

Check the zombie state from another terminal while the parent is sleeping:

```bash
ps -el | grep zombie
```

Example output:

```text
Parent Process
Parent PID: 1234
Child PID: 1235
Child Process
Child PID: 1235
Parent PID: 1234
```

Here:

- The child terminates first with `exit(0)`.
- The parent continues to sleep for 30 seconds.
- `ps` shows the child in `Z` (zombie/defunct) state until the parent terminates.

## Orphan Process

An orphan process is a child process whose parent has terminated before the child completes.

The orphan child is then adopted by the `init` process (PID 1), and `getppid()` returns a new parent PID.

Program file: `OrphanProcess.c`

In the program:

1. `fork()` creates a child process.
2. The parent prints its PID and the child PID, prints `Parent Is Terminating ...`, and terminates immediately with `exit(0)`.
3. The child executes `sleep(5)` so that the parent terminates first.
4. The child then prints its own PID with `getpid()` and its new parent PID with `getppid()`, and sleeps for 20 seconds.

Compile and run:

```bash
gcc OrphanProcess.c -o orphan
./orphan
```

Example output:

```text
Parent Process
Parent PID: 2234
Child PID: 2235
Parent Is Terminating ...

Child Process
Child PID: 2235
New Parent PID: 1
```

Here:

- The parent terminates before the child.
- The child becomes orphan.
- `getppid()` after the parent termination returns the PID of the adopting process (`init`/`systemd`), instead of the original parent PID.

## Threads Using `pthread`

A thread is the smallest unit of execution within a process. All threads of a process share the same memory and resources.

POSIX threads are created using the `pthread` library:

```c
pthread_create(&tid, NULL, fun1, NULL);
pthread_join(tid, NULL);
```

- `pthread_create()` — creates a new thread that starts execution from function `fun1`.
- `pthread_join()` — makes the main thread wait until the created thread terminates.
- `pthread_t tid` — variable holding the thread identifier.

Program file: `Threads.c`

In the program:

1. Function `fun1()` prints numbers from `1` to `10`.
2. `main()` creates a thread `tid` that runs `fun1()`.
3. `pthread_join(tid, NULL)` blocks `main()` until the thread finishes.
4. After the thread completes, `main()` prints numbers from `20` to `30`.

Compile and run (link with `-lpthread`):

```bash
gcc Threads.c -o threads -lpthread
./threads
```

Example output:

```text
1 2 3 4 5 6 7 8 9 10
20 21 22 23 24 25 26 27 28 29 30
```

Here:

- The first line `1 ... 10` is printed by the created thread.
- `pthread_join()` ensures the second loop `20 ... 30` in `main()` runs only after the thread completes.

## Orphan vs Zombie Process

| Feature | Orphan Process | Zombie Process |
| --- | --- | --- |
| Definition | Parent terminates before child | Child terminates before parent collects status |
| Parent state | Terminated | Alive but not calling `wait()` |
| Adopted by `init` | Yes | No |
| Resource in process table | Running process | Terminated entry waiting for `wait()` |

## Result

The programs for orphan process, zombie process, and POSIX threads were studied, compiled, and executed successfully. The behavior of `fork()`, `getpid()`, `getppid()`, `exit()`, `pthread_create()`, and `pthread_join()` was observed and verified.
