# Basic Linux Commands and File Management in CentOS 7

## Date

10 August 2026

## Aim

To study basic Linux commands for identifying users, creating and editing files, switching users, checking paths, file ownership, permissions, and searching text using `grep`.

## Requirements

- CentOS 7 environment
- Terminal access with root and non-root (`bit`) users
- `vim` editor

## Identification of Root and Non-Root Users

The terminal prompt indicates the type of user currently logged in:

- **Root user:** `[root@lab1-m13 ~]#`
  - `#` indicates that the current user is root.
- **Non-root user:** `[bit@lab1-m13 ~]$`
  - `$` indicates that the current user is a non-root user.

## Check the Current Path

The `pwd` command displays the current working directory:

```bash
pwd
```

The home directory of the root user is `/root`. The home directory of a non-root user such as `bit` is `/home/bit`.

## Switch Users

The `su` command switches from one user to another:

The `su -` form switches the user and starts a login shell with the target user's environment and home directory:

```bash
su - bit
su -
```

The `su` command without `-` switches the effective user without starting a full login shell.

## Create a File

The `touch` command creates an empty file:

```bash
touch test.txt
```

Check whether the file was created:

```bash
ls -l test.txt
```

## Display File Contents

The `cat` command displays the contents of a file:

```bash
cat test.txt
cat /root/test.txt
```

## Create and Edit a File Using Vim

The `vim` editor can be used to create and edit a file:

```bash
vim test.txt
```

1. Enter insert mode and write the content, for example: `This file is created by Debojit.`
2. Press `Esc` to leave insert mode.
3. Press `Shift + :` to open the command line.
4. Type `wq` and press `Enter`.

`wq` means **write and quit**: save the file and exit Vim.

## Check File Ownership and Permissions

The `ls -l` command displays the ownership and permissions of a file:

```bash
ls -l test.txt
```

Example output:

```text
-rw-r--r-- 1 root root 0 Aug 10 11:01 test.txt
```

In this output:

- The first `root` is the file owner.
- The second `root` is the group owner.

### File Permissions

A typical permission entry is:

```text
-rw-r--r--
```

- The first character represents the file type:
  - `-` — regular file
  - `d` — directory
- The remaining nine characters represent permissions for:
  - User
  - Group
  - Others

Permission values are:

| Permission | Meaning | Value |
| --- | --- | ---: |
| `r` | Read | 4 |
| `w` | Write | 2 |
| `x` | Execute | 1 |

Therefore, `rwx = 4 + 2 + 1 = 7`.

Full permission for a directory is `777`:

```text
7 | 7 | 7
User | Group | Others
```

Each category has read, write, and execute permission. For a file, full permission is `666`.

## Check Directory Details

To display the details of the `/root` directory itself, use:

```bash
ls -ld /root
```

- `ls` — list
- `-l` — long format
- `-d` — display the directory itself
- `/root` — target directory

## Use of the `grep` Command

The `grep` command searches for a particular word or pattern in text or command output:

```bash
ls -l / | grep root
```

Here:

- `ls -l /` lists the contents of the root directory `/`.
- The pipe symbol (`|`) passes the output of the first command to `grep`.
- `grep root` displays only the lines containing the word `root`.

Therefore, `ls -l / | grep root` lists the contents of `/` and displays only the lines containing `root`.

## Result

The basic Linux commands for user identification, user switching, file creation, file editing, path checking, file ownership, permissions, and text searching were studied and executed successfully.
