#!/bin/bash
rg "from '(.*)';$" -Ior '$1' | sed '/^\./d' | sed '/^\@eai/d' | sort | uniq >using.txt
pnpm list -P | tail -n+6 | sed 's/[[:space:]].*//' | sort >installed.txt
comm -13 using.txt installed.txt >remove.txt
comm -23 using.txt installed.txt >check.txt
