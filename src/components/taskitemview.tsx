import moment, { Moment } from "moment";
import { MarkdownRenderer } from "obsidian";
import * as React from "react";
import { getFileTitle } from "../../../dataview-util/dataview";
import { TasksTimelineView } from "../../../src/views";
import { TaskDataModel, recurrenceSymbol } from "../../../utils/tasks";
import * as Icons from './asserts/icons';
import { TaskItemEventHandlersContext, UserOptionContext } from "./context";

const getRelative = (someDate: Moment) => {
    if (moment().diff(someDate, 'days') >= 1 || moment().diff(someDate, 'days') <= -1) {
        return someDate.fromNow();
    } else {
        return someDate.calendar().split(' ')[0];
    };
};

const defaultTaskItemProps = {
    taskItem: {} as TaskDataModel
}

type TaskItemProps = Readonly<typeof defaultTaskItemProps>;
const defaultTaskItemState = {
    taskStatus: "task" as string,
}
type TaskItemState = typeof defaultTaskItemState;
export class TaskItemView extends React.Component<TaskItemProps, TaskItemState> {
    constructor(props: TaskItemProps) {
        super(props);
        this.state = {
            taskStatus: "task",
        }
    }

    render(): React.ReactNode {
        const item = this.props.taskItem;
        const display = item.visual || item.text;
        const line = item.line;
        const col = item.position.end.col;
        const link = item.link.path.replace("'", "&apos;");
        const isDailyNote = item.dailyNote;
        const color = item.fontMatter["color"];
        const ariaLabel = getFileTitle(item.path);
        const tags = [...new Set(item.tags)];
        const outlinks = item.outlinks;
        return (
            <TaskItemEventHandlersContext.Consumer>{
                callbacks => {
                    const openTaskFile = () => {
                        callbacks.handleOpenFile(item.path, item.position);
                    };
                    const onCompleteTask = () => {
                        callbacks.handleCompleteTask(item.path, item.position);
                    }
                    const onModifyTask = () => {
                        callbacks.handleModifyTask(item.path, item.position);
                    }
                    return (
                        <UserOptionContext.Consumer>{
                            ({ dateFormat, hideTags }) =>
                            (<div data-line={line} data-col={col} data-link={link} data-dailynote={isDailyNote}
                                className={`task ${item.status}`}
                                style={{ "--task-color": color || "var(--text-muted)" } as React.CSSProperties} aria-label={ariaLabel}>
                                <StripWithIcon status={item.status} onClick={onCompleteTask} />
                                <div className='lines' onClick={openTaskFile}>
                                    <div className="content">
                                        <Content display={display} fileName={item.path} />
                                    </div>
                                    <div className='line info'>
                                        {callbacks.handleModifyTask &&
                                            <ModifyBadge onClick={onModifyTask}></ModifyBadge>}
                                        {item.created &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='relative' ariaLabel={"create at " + item.created.format(dateFormat)}
                                                label={getRelative(item.created)} icon={Icons.taskIcon} />}
                                        {item.start &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='relative' ariaLabel={"start at " + item.start.format(dateFormat)}
                                                label={getRelative(item.start)} icon={Icons.startIcon} />}
                                        {item.scheduled &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='relative' ariaLabel={"scheduled to " + item.scheduled.format(dateFormat)}
                                                label={getRelative(item.scheduled)} icon={Icons.scheduledIcon} />}
                                        {item.due &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='relative' ariaLabel={"due at " + item.due.format(dateFormat)}
                                                label={getRelative(item.due)} icon={Icons.dueIcon} />}
                                        {item.completion &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='relative' ariaLabel={"complete at " + item.completion.format(dateFormat)}
                                                label={getRelative(item.completion)} icon={Icons.doneIcon} />}

                                        {item.recurrence &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='repeat' ariaLabel={'recurrent: ' + item.recurrence.replace(recurrenceSymbol, '')}
                                                label={item.recurrence.replace(recurrenceSymbol, '')} icon={Icons.repeatIcon} />}

                                        {item.priorityLabel &&
                                            <DateStatusBadge //onClick={openTaskFile}
                                                className='priority' ariaLabel={'priority: ' + item.priorityLabel}
                                                label={item.priorityLabel} icon={Icons.priorityIcon} />}
                                        <FileBadge filePath={item.path} subPath={item.section.subpath || ""} />
                                        {[...new Set(tags)].filter(t => !hideTags.includes(t)).map((t, i) => {
                                            return < TagBadge tag={t} key={i} />
                                        }
                                        )}
                                    </div>
                                </div>
                            </div>)}
                        </UserOptionContext.Consumer>
                    )
                }}
            </TaskItemEventHandlersContext.Consumer>
        )
    }
}

const defaultContentProps = {
    display: "",
    fileName: "",
}
type ContentProps = Readonly<typeof defaultContentProps>
class Content extends React.Component<ContentProps> {
    render(): React.ReactNode {
        const cont = createEl("a")
        MarkdownRenderer.renderMarkdown(this.props.display, cont, this.props.fileName, TasksTimelineView.view!);
        return <a dangerouslySetInnerHTML={{ __html: cont.firstElementChild!.innerHTML }} />
    }
}


const defaultStripWithIconProps = {
    status: "task",
    onClick: () => { },
}

type StripWithIconProps = Readonly<typeof defaultStripWithIconProps>
class StripWithIcon extends React.Component<StripWithIconProps> {

    render(): React.ReactNode {
        return (
            <div className='timeline' onClick={this.props.onClick}>
                <a className='icon'>{Icons.getTaskStatusIcon(this.props.status)}</a>
                <a className='stripe'></a>
            </div>
        )
    }
}

const defaultTagBadgeProps = {
    tag: "",
};

type TagBadgeProps = Readonly<typeof defaultTagBadgeProps>;

class TagBadge extends React.Component<TagBadgeProps> {

    render(): React.ReactNode {
        return (
            <UserOptionContext.Consumer>{({ tagPalette }) => {
                const tag = this.props.tag;
                var tagText = tag.replace("#", "");
                var color;
                if (Object.keys(tagPalette).contains(tag)) color = tagPalette[tag];
                var style: {};
                if (color) {
                    style = {
                        '--tag-color': color,
                        '--tag-background': `${color}1a`,
                        'zIndex': 9999,
                    };
                } else {
                    style = {
                        '--tag-color': 'var(--text-muted)',
                        'zIndex': 9999,
                    };
                };
                return (
                    <TaskItemEventHandlersContext.Consumer>{callbacks => (
                        <a href={tag} className={'tag'} target='_blank' rel='noopener' style={style} aria-label={tag}
                            onClick={(e) => {
                                e.stopPropagation();
                                callbacks.handleTagClick(tag);
                            }}>
                            <div className='icon'>{Icons.tagIcon}</div>
                            <div className='label'>{tagText}</div>
                        </a>)}
                    </TaskItemEventHandlersContext.Consumer>)
            }}
            </UserOptionContext.Consumer>
        );
    }
}

const defaultFileBadgeProps = {
    filePath: "",
    subPath: "",
}

type FileBadgeProps = Readonly<typeof defaultFileBadgeProps>;
class FileBadge extends React.Component<FileBadgeProps> {
    render(): React.ReactNode {
        const filePath = this.props.filePath;
        const fileName = getFileTitle(filePath);
        const subPath = this.props.subPath;
        return (
            <a className='file' aria-label={filePath}>
                <div className='icon'>{Icons.fileIcon}</div>
                <div className='label'>{fileName}</div>
                <span className='header'>{subPath != "" ? "  >  " + subPath : subPath}</span>
            </a>)
    }
}

const defaultBadgeProps = {
    className: "",
    ariaLabel: "",
    label: "",
    icon: Icons.taskIcon,
    //onClick: () => { },
}

type BadgeProps = Readonly<typeof defaultBadgeProps>;

class DateStatusBadge extends React.Component<BadgeProps> {

    render(): React.ReactNode {
        const type = this.props.className;
        const aria_label = this.props.ariaLabel;
        const label = this.props.label;
        const icon = this.props.icon;
        return (
            <a className={type} aria-label={aria_label} /*onClick={this.props.onClick}*/>
                <div className='icon'>{icon}</div>
                <div className='label'>{label}</div>
            </a>
        );
    }
}

const defaultModifyBadgeProps = {
    onClick: () => { }
};
type ModifyBadgeProps = Readonly<typeof defaultModifyBadgeProps>;
class ModifyBadge extends React.Component<ModifyBadgeProps> {
    render(): React.ReactNode {
        return (
            <a aria-label="Modify Task" onClick={this.props.onClick}>✏️</a>
        )
    }
}