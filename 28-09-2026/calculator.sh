echo -m "Enter First Number:"
read a

echo -m "Enter Second Number:"
read b

if [ -z "$a" ] || [ -z "$b" ]
then
    echo "Please Enter A value"
else
    menu="1 for +
2 for -
3 for *
4 for /
5 for Exit"

    while true
    do
        clear
        echo "$menu"

        echo -m "Enter Your Choice:"
        read ch

        case $ch in

        1)
            echo "$a + $b = `expr $a + $b`"
            read
            ;;

        2)
            if [ $a -gt $b ]
            then
                echo "$a - $b = `expr $a - $b`"
            else
                echo "$b - $a = `expr $b - $a`"
            fi
            read
            ;;

        3)
            echo "$a * $b = `expr $a \* $b`"
            read
            ;;

        4)
            if [ $a -gt $b ]
            then
                echo "$a/$b = `expr $a / $b`"
            else
                echo "$b/$a = `expr $b / $a`"
            fi
            read
            ;;

        5)
            exit 0
            ;;

        esac
    done
fi