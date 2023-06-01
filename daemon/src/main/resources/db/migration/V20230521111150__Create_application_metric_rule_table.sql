create table application_metric_rule
(
    id                  blob                 not null primary key,
    creation_time       timestamp            not null,
    last_update_time    timestamp            not null,
    version             bigint               not null,
    name                varchar(255)         not null,
    type                varchar(255)         not null,
    application_id      blob                 not null references application (id),
    metric_name         TEXT                 not null,
    divisor_metric_name TEXT                 null,
    operation           varchar(255)         not null,
    value1              float                not null,
    value2              float,
    enabled             boolean default true not null
);
