import Container from "@/components/Container";
import Title from "@/components/Title";
import { getBlogCategories, getOthersBlog, getSingleBlog } from "@/lib/wordpress";
import dayjs from "dayjs";
import { Calendar, ChevronLeftIcon, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SingleBlogPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const blog = await getSingleBlog(slug);
  if (!blog) return notFound();

  const [categories, otherBlogs] = await Promise.all([
    getBlogCategories(),
    getOthersBlog(slug, 5),
  ]);

  return (
    <div className="py-10">
      <Container className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <article className="md:col-span-3">
          {blog.mainImage && (
            <Image
              src={blog.mainImage}
              alt={blog.title}
              width={800}
              height={800}
              unoptimized
              className="max-h-[500px] w-full rounded-lg object-cover"
            />
          )}
          <div className="my-7 flex items-center gap-5 text-xs">
            <p className="font-semibold tracking-wider text-shop_dark_green">
              {blog.blogcategories.map((category) => category.title).join(", ")}
            </p>
            <p className="flex items-center gap-1 text-lightColor">
              <Pencil size={15} />
              {blog.author.name}
            </p>
            <p className="flex items-center gap-1 text-lightColor">
              <Calendar size={15} />
              {dayjs(blog.publishedAt).format("MMMM D, YYYY")}
            </p>
          </div>
          <h1 className="my-5 text-2xl font-bold">{blog.title}</h1>
          <div
            className="wordpress-content text-lightColor"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
          <Link href="/blog" className="mt-10 flex items-center gap-1">
            <ChevronLeftIcon className="size-5" />
            <span className="text-sm font-semibold">Back to blog</span>
          </Link>
        </article>

        <aside>
          <div className="rounded-md border border-lightColor p-5">
            <Title className="text-base">Blog Categories</Title>
            <div className="mt-2 space-y-2">
              {categories.map(({ blogcategories }, index) => (
                <p
                  key={`${blogcategories[0]?.title}-${index}`}
                  className="flex justify-between text-sm font-medium text-lightColor"
                >
                  <span>{blogcategories[0]?.title}</span>
                </p>
              ))}
            </div>
          </div>
          <div className="mt-10 rounded-md border border-lightColor p-5">
            <Title className="text-base">Latest Blogs</Title>
            <div className="mt-4 space-y-4">
              {otherBlogs.map((post) => (
                <Link
                  href={`/blog/${post.slug.current}`}
                  key={post._id}
                  className="group flex items-center gap-2"
                >
                  {post.mainImage && (
                    <Image
                      src={post.mainImage}
                      alt={post.title}
                      width={100}
                      height={100}
                      unoptimized
                      className="h-16 w-16 rounded-full border-[1px] border-shop_dark_green/10 object-cover"
                    />
                  )}
                  <span className="line-clamp-2 text-sm text-lightColor group-hover:text-shop_dark_green">
                    {post.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </Container>
    </div>
  );
};

export default SingleBlogPage;
