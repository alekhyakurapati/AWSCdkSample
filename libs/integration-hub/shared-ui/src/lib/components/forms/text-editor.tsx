import ReactCodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { useController } from 'react-hook-form';
import { nord } from '@uiw/codemirror-theme-nord';
import { json } from '@codemirror/lang-json';

interface TextEditorProps extends ReactCodeMirrorProps {
    name: string;
}

export const TextEditor = ({ name, ...props }: TextEditorProps) => {
    const { field } = useController({ name });

    // console.log(nord);
    return (
        <ReactCodeMirror
            basicSetup={{ highlightActiveLine: false, highlightActiveLineGutter: false }}
            theme={nord}
            extensions={[json()]}
            {...props}
            {...field}
        />
    );
};
