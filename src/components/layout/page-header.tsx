import AppBreadcrumbs from "./breadcrumbs";

type Crumb = {
  label: string;
  href?: string;
};

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <AppBreadcrumbs items={breadcrumbs} />
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description ? (
            <p className="mt-2 text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>
    </div>
  );
}